"use server"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import {
    AnimeByIdDocument,
    AnimeShortMediaByIdDocument,
    DeleteEntryDocument,
    DeleteEntryMutationVariables,
    MediaSort,
    MediaStatus,
    SearchAnimeShortMediaDocument,
    UpdateEntryDocument,
    UpdateEntryMutationVariables,
} from "@/gql/graphql"
import { logger } from "@/lib/helpers/debug"
import { AnilistShortMedia, AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { anilist_findMediaEdge, anilist_getEpisodeCeilingFromMedia } from "@/lib/anilist/utils"
import { cache } from "react"
import { redirect } from "next/navigation"
import axios from "axios"
import { matching_compareTitleVariationsToMedia } from "@/lib/local-library/utils/matching.utils"
import { fetchAniZipData } from "@/lib/anizip/helpers"
import Bottleneck from "bottleneck"
import { fetchAnilistShortMedia } from "@/lib/anilist/helpers"
import { AniZipData } from "@/lib/anizip/types"

/* -------------------------------------------------------------------------------------------------
 * General
 * -----------------------------------------------------------------------------------------------*/

/**
 * Get anime info from page params
 */
export const getAnimeInfo = cache(async (params: { id: string }) => {
    if (!params.id || isNaN(Number(params.id))) redirect("/")

    const [animeRes, aniZipRes] = await Promise.allSettled([
        useAniListAsyncQuery(AnimeByIdDocument, { id: Number(params.id) }),
        axios.get<AniZipData>("https://api.ani.zip/mappings?anilist_id=" + Number(params.id)),
    ])

    if (animeRes.status === "rejected" || !animeRes.value.Media) {
        logger("view/id").error("Could not fetch media data")
        redirect("/")
    }

    logger("view/id").info("Fetched media data for " + animeRes.value.Media.title?.english)

    return {
        media: animeRes.value.Media,
        aniZipData: aniZipRes.status === "fulfilled" ? (aniZipRes.value.data || undefined) : undefined,
    }

})

/* -------------------------------------------------------------------------------------------------
 * Edit collection entries
 * -----------------------------------------------------------------------------------------------*/

export async function updateEntry(variables: UpdateEntryMutationVariables, token: string | null | undefined) {
    try {
        if (token) {
            const mutation = await useAniListAsyncQuery(UpdateEntryDocument, {
                ...variables,
            }, token)
            return true
        }
    } catch (e) {
        logger("anilist/updateEntry").error("Could not update entry")
        logger("anilist/updateEntry").error(e)
        return false
    }
}

export async function deleteEntry(variables: DeleteEntryMutationVariables, token: string | null | undefined) {
    try {
        if (token) {
            const mutation = await useAniListAsyncQuery(DeleteEntryDocument, {
                ...variables,
            }, token)
            return true
        }
    } catch (e) {
        logger("anilist/updateEntry").error("Could not delete entry")
        logger("anilist/updateEntry").error(e)
        return false
    }
}

/**
 * @description Caveats
 * - Slow
 * @description Purpose
 * - Retrieves a specific media's sequels and prequels using {fetchMediaTree}
 * - Returns some utilities
 * @param props
 * @param limiter
 */
export async function analyzeMediaTree(props: {
    media: AnilistShortMedia | AnilistShowcaseMedia | number,
    _mediaCache: Map<number, AnilistShortMedia>,
    _aniZipCache: Map<number, AniZipData>,
}, limiter?: Bottleneck) {

    const { media: _media, _mediaCache, _aniZipCache } = props

    let media: AnilistShortMedia | AnilistShowcaseMedia

    if (typeof _media === "number")
        media = (await fetchAnilistShortMedia(_media, _mediaCache))!
    else
        media = _media

    const treeMap = new Map<number, AnilistShortMedia>()
    const start = performance.now()
    logger("anilist/analyzeMediaTree").warning("Fetching media tree in for " + media.title?.english)
    await fetchMediaTree({
        media,
        treeMap,
        _mediaCache: _mediaCache,
    }, limiter)
    const end = performance.now()
    logger("anilist/analyzeMediaTree").info("Fetched media tree in " + (end - start) + "ms")

    // Sort media list
    const mediaList = [...treeMap.values()].sort((a, b) => new Date(a.startDate?.year || 0, a.startDate?.month || 0).getTime() - new Date(b.startDate?.year || 0, b.startDate?.month || 0).getTime())

    treeMap.clear()

    // Total number of episodes
    const totalEpisodeCount = mediaList.reduce((prev, curr) => prev + (curr.episodes || 0), 0)


    let listWithInfo: {
        media: AnilistShortMedia,
        aniZipData: AniZipData | undefined,
        minAbsoluteEpisode: number,
        maxAbsoluteEpisode: number
    }[] = []
    // const aniZipRes = await Promise.allSettled(mediaList.map(media => axios.get<AniZipData>("https://api.ani.zip/mappings?anilist_id=" + media.id)))


    for (const medium of mediaList) {

        const aniZipData = await fetchAniZipData(medium.id, _aniZipCache)

        const maxEpisode = anilist_getEpisodeCeilingFromMedia(medium)
        listWithInfo.push({
            media: medium,
            aniZipData: aniZipData,
            minAbsoluteEpisode: (aniZipData?.episodes?.["1"]?.absoluteEpisodeNumber || 1),
            maxAbsoluteEpisode: (aniZipData?.episodes?.["1"]?.absoluteEpisodeNumber || 1) - 1 + maxEpisode,
        })
    }

    function normalizeEpisode(absoluteEpisodeNumber: number) {
        const correspondingMedia = listWithInfo.find(media => media.minAbsoluteEpisode <= absoluteEpisodeNumber && media.maxAbsoluteEpisode >= absoluteEpisodeNumber)
        if (correspondingMedia) {

            logger("analyzeMediaTree/normalizeEpisode").info(`(${correspondingMedia.media.title?.english}) Normalized episode ${absoluteEpisodeNumber} to ${absoluteEpisodeNumber - (correspondingMedia.minAbsoluteEpisode - 1)}`)
            return {
                media: correspondingMedia.media,
                relativeEpisode: absoluteEpisodeNumber - (correspondingMedia.minAbsoluteEpisode - 1),
            }
        }
    }

    return {
        totalEpisodeCount,
        listWithInfo,
        normalizeEpisode,
    }

}

/**
 * @description Purpose
 * Populates `treeMap` with a media's prequels and sequels
 * @param props
 * @param limiter
 */
export async function fetchMediaTree(props: {
    media: AnilistShortMedia | AnilistShowcaseMedia,
    _mediaCache: Map<number, AnilistShortMedia>,
    treeMap: Map<number, AnilistShortMedia>,
    relation?: "PREQUEL" | "SEQUEL" | "BOTH",
    excludeStatus?: MediaStatus[],
}, limiter?: Bottleneck) {

    const {
        media: _originalMedia,
        _mediaCache,
        treeMap,
        relation = "BOTH",
        excludeStatus = [],
    } = props

    let media: AnilistShortMedia = _originalMedia

    // Make sure the media has `relations` property, if not, fetch it
    if ((_originalMedia as AnilistShortMedia).relations === undefined) {
        if (_mediaCache.has(_originalMedia.id)) {
            media = _mediaCache.get(_originalMedia.id)!
            treeMap.set(media.id, media)
        } else {
            if (limiter) {
                media = (await limiter.schedule(() => useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: _originalMedia.id }))).Media!
            } else {
                media = (await useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: _originalMedia.id })).Media!
            }
            _mediaCache.set(media.id, media)
            treeMap.set(media.id, media)
        }
    } else {
        treeMap.set(media.id, media)
    }

    async function getEdges() {
        // Find prequel
        const prequel = (relation === "BOTH" || relation === "PREQUEL") ? anilist_findMediaEdge({
            media,
            relation: "PREQUEL",
        })?.node : undefined
        // Find sequel
        const sequel = (relation === "BOTH" || relation === "SEQUEL") ? anilist_findMediaEdge({
            media,
            relation: "SEQUEL",
            force: true,
            forceFormats: ["TV", "TV_SHORT", "OVA", "MOVIE", "ONA", "SPECIAL"],
        })?.node : undefined
        // For each edge
        for (const edge of [prequel, sequel].filter(Boolean)) {

            if (edge.status && excludeStatus.includes(edge.status)) return

            if (_mediaCache.has(edge.id) && !treeMap.has(edge.id)) {

                treeMap.set(edge.id, _mediaCache.get(edge.id)!) // Add the edge to the map if it's in the cache
                // Get the edge's edges
                await fetchMediaTree({
                    media: _mediaCache.get(edge.id)!,
                    _mediaCache,
                    treeMap,
                    relation,
                    excludeStatus,
                }, limiter)

            } else if (!_mediaCache.has(edge.id) && !treeMap.has(edge.id)) { // If the edge is not in the cache

                // Fetch it from AniList
                // const _ = (await useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: edge.id })).Media!
                let _: AnilistShortMedia
                if (limiter) {
                    _ = (await limiter.schedule(() => useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: edge.id }))).Media!
                } else {
                    _ = (await useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: edge.id })).Media!
                }
                treeMap.set(edge.id, _) // Add it to the map
                _mediaCache.set(edge.id, _) // Add it to the cache
                // Get the edge's edges
                await fetchMediaTree({ media: _, _mediaCache, treeMap, relation, excludeStatus }, limiter)

            }

        }
    }

    await getEdges()

}

/**
 * DO NOT USE to look up parsed titles
 * AniList sucks with search
 */
export async function searchWithAnilist(
    {
        name,
        perPage = 5,
        status = ["FINISHED", "CANCELLED", "NOT_YET_RELEASED", "RELEASING"],
        sort = "SEARCH_MATCH",
        method = "SearchName",
    }: {
        name: string,
        method?: string,
        perPage?: number,
        status?: MediaStatus[],
        sort?: MediaSort
    },
): Promise<AnilistShortMedia[]> {
    logger("searchWithAnilist").info("Searching", name)
    const res = await useAniListAsyncQuery(SearchAnimeShortMediaDocument, {
        search: name,
        page: 1,
        perPage,
        status,
        sort,
        method,
    })
    logger("searchWithAnilist").info("Found", res.Page?.media?.length)
    return res.Page?.media?.filter(Boolean) ?? []
}


/**
 * DO NOT USE to look up parsed titles
 * AniList sucks with search
 */
export async function searchUniqueWithAnilist({ name, ...method }: {
    name: string,
    method: string,
    perPage: number,
    status: MediaStatus[],
    sort: MediaSort
}) {
    logger("searchWithAnilist").info("Ran")
    const res = await useAniListAsyncQuery(SearchAnimeShortMediaDocument, { search: name, page: 1, ...method })
    const media = res.Page?.media?.filter(Boolean).map(media => matching_compareTitleVariationsToMedia(media, [name]))
    if (!media?.length) return res
    const lowest = media.reduce((prev, curr) => prev.distance <= curr.distance ? prev : curr)
    return { Page: { media: [lowest.media] } }
}
