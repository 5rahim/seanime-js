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
import { findMediaEdge } from "@/lib/anilist/utils"
import { compareTitleVariationsToMediaTitles } from "@/lib/local-library/utils"
import { cache } from "react"
import { redirect } from "next/navigation"
import axios from "axios"

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

    if (animeRes.status === "rejected") redirect("/")
    if (!animeRes.value.Media) redirect("/")

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

/* -------------------------------------------------------------------------------------------------
 * Specialized actions
 * -----------------------------------------------------------------------------------------------*/

/**
 * {@link https://github.com/ThaUnknown/miru/blob/master/src/renderer/modules/anime.js#L317}
 * @param opts
 */
export async function normalizeMediaEpisode(opts: {
    media: AnilistShortMedia | null | undefined,
    episode?: number | null,
    increment?: boolean | null,
    offset?: number,
    rootMedia?: AnilistShortMedia,
    force?: boolean
    _cache?: Map<number, AnilistShortMedia>,
    _treeSet?: Set<AnilistShortMedia>,
}) {
    // media, episode, increment, offset, force
    if (!opts.media || !(opts.episode || opts.force)) return undefined

    let { media, episode, increment, offset = 0, rootMedia = opts.media, force } = opts

    // Get the highest episode of the root media
    const rootHighest = (rootMedia.nextAiringEpisode?.episode || rootMedia.episodes!)
    // Find prequel if we don't increment
    const prequel = !increment ? findMediaEdge(media, "PREQUEL")?.node : undefined
    // Find prequel if there's no prequel, and we increment, find sequel
    const sequel = (!prequel && (increment || increment === null)) ? findMediaEdge(media, "SEQUEL")?.node : undefined
    // Edge is either the prequel or sequel
    const edge = prequel || sequel

    // For recursive, reset increment to: whether we increment or there is no prequel
    increment = increment ?? !prequel

    if (!edge) {
        const obj = { media, episode: episode! - offset, offset, increment, rootMedia, failed: true }
        if (!force) {
            // console.warn("Error in parsing!", obj)
            // toast('Parsing Error', {
            //     description: `Failed resolving anime episode!\n${media.title.userPreferred} - ${episode - offset}`
            // })
        }
        return obj
    }

    opts._treeSet?.add(media)

    if (opts._cache?.has(edge.id)) {
        media = opts._cache.get(edge.id)!
        opts._treeSet?.add(media)
    } else {
        media = (await useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: edge.id })).Media!
        opts._cache?.set(edge.id, media)
        opts._treeSet?.add(media)
    }

    const highest = media.nextAiringEpisode?.episode || media.episodes!

    const diff = episode! - (highest + offset)
    offset += increment ? rootHighest : highest
    if (increment) rootMedia = media

    // force marches till end of tree, no need for checks
    if (!force && diff <= rootHighest) {
        episode! -= offset
        return { media, episode, offset, increment, rootMedia }
    }

    return normalizeMediaEpisode({ media, episode, increment, offset, rootMedia, force, _cache: opts?._cache, _treeSet: opts._treeSet })
}

/**
 * /!\ Very slow
 * The first tree lookup can take up to 1s
 * @param props
 */
export async function experimental_analyzeMediaTree(props: {
    media: AnilistShortMedia | AnilistShowcaseMedia | number,
    _mediaCache: Map<number, AnilistShortMedia>,
    _aniZipCache: Map<number, AniZipData>,
}) {

    const { media: _media, _mediaCache, _aniZipCache } = props

    let media: AnilistShortMedia | AnilistShowcaseMedia

    if (typeof _media === "number")
        media = (await useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: _media })).Media!
    else
        media = _media

    const treeMap = new Map<number, AnilistShortMedia>()
    const start = performance.now()
    logger("experimental_analyzeMediaTree").warning("Fetching media tree in for " + media.title?.english)
    await experimental_fetchMediaTree({ media, treeMap, _mediaCache: _mediaCache })
    const end = performance.now()
    logger("experimental_analyzeMediaTree").info("Fetched media tree in " + (end - start) + "ms")

    // Sort media list
    const mediaList = [...treeMap.values()].sort((a, b) => new Date(a.startDate?.year || 0, a.startDate?.month || 0).getTime() - new Date(b.startDate?.year || 0, b.startDate?.month || 0).getTime())

    treeMap.clear()

    // Total number of episodes
    const totalEpisodeCount = mediaList.reduce((prev, curr) => prev + (curr.episodes || 0), 0)


    let listWithInfo: { media: AnilistShortMedia, aniZipData: AniZipData | undefined, minAbsoluteEpisode: number, maxAbsoluteEpisode: number }[] = []
    // const aniZipRes = await Promise.allSettled(mediaList.map(media => axios.get<AniZipData>("https://api.ani.zip/mappings?anilist_id=" + media.id)))


    for (const medium of mediaList) {

        let aniZipData: AniZipData | undefined
        if (_aniZipCache.has(medium.id)) {
            aniZipData = _aniZipCache.get(medium.id)
        } else {
            aniZipData = (await axios.get<AniZipData>("https://api.ani.zip/mappings?anilist_id=" + medium.id)).data
            _aniZipCache.set(medium.id, aniZipData)
        }

        const maxEpisode = ((medium.nextAiringEpisode?.episode ? medium.nextAiringEpisode?.episode - 1 : undefined) || medium.episodes || 0)
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

            logger("experimental_analyzeMediaTree/normalizeEpisode").info(`(${correspondingMedia.media.title?.english}) Normalized episode ${absoluteEpisodeNumber} to ${absoluteEpisodeNumber - (correspondingMedia.minAbsoluteEpisode - 1)}`)
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
 * Populates a Map with a medium's edges for all directions
 * @param props
 */
export async function experimental_fetchMediaTree(props: {
    media: AnilistShortMedia | AnilistShowcaseMedia,
    _mediaCache: Map<number, AnilistShortMedia>,
    treeMap: Map<number, AnilistShortMedia>
}) {

    const { media: _originalMedia, _mediaCache, treeMap } = props

    let media = _originalMedia

    // Make sure the media has `relations` property, if not, fetch it
    if (!(_originalMedia as AnilistShortMedia).relations) {
        if (_mediaCache.has(_originalMedia.id)) {
            media = _mediaCache.get(_originalMedia.id)!
            treeMap.set(media.id, media)
        } else {
            media = (await useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: _originalMedia.id })).Media!
            _mediaCache.set(media.id, media)
            treeMap.set(media.id, media)
        }
    } else {
        treeMap.set(media.id, media)
    }

    async function getEdges() {
        // Find prequel
        const prequel = findMediaEdge(media, "PREQUEL")?.node
        // Find sequel
        const sequel = findMediaEdge(media, "SEQUEL")?.node
        // For each edge
        for (const edge of [prequel, sequel].filter(Boolean)) {

            if (_mediaCache.has(edge.id) && !treeMap.has(edge.id)) {
                treeMap.set(edge.id, _mediaCache.get(edge.id)!) // Add the edge to the map if it's in the cache
                // Get the edge's edges
                await experimental_fetchMediaTree({ media: _mediaCache.get(edge.id)!, _mediaCache, treeMap })
            } else if (!_mediaCache.has(edge.id) && !treeMap.has(edge.id)) { // If the edge is not in the cache
                // Fetch it from AniList
                const _ = (await useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: edge.id })).Media!
                treeMap.set(edge.id, _) // Add it to the map
                _mediaCache.set(edge.id, _) // Add it to the cache
                // Get the edge's edges
                await experimental_fetchMediaTree({ media: _, _mediaCache, treeMap })
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
    const media = res.Page?.media?.filter(Boolean).map(media => compareTitleVariationsToMediaTitles(media, [name]))
    if (!media?.length) return res
    const lowest = media.reduce((prev, curr) => prev.distance <= curr.distance ? prev : curr)
    return { Page: { media: [lowest.media] } }
}
