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
import { AnilistShortMedia } from "@/lib/anilist/fragment"
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

    if (opts._cache?.has(edge.id)) {
        media = opts._cache.get(edge.id)!
    } else {
        media = (await useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: edge.id })).Media!
        opts._cache?.set(edge.id, media)
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

    return normalizeMediaEpisode({ media, episode, increment, offset, rootMedia, force, _cache: opts?._cache })
}

export async function experimental__fetchRelatedMedia(
    media: AnilistShortMedia,
    queryMap: Map<number, AnilistShortMedia>,
    token: string,
): Promise<AnilistShortMedia[]> {
    const relatedMedia: AnilistShortMedia[] = []

    async function getEdges() {
        // Find prequel if we don't increment
        const prequel = findMediaEdge(media, "PREQUEL")?.node
        // Find prequel if there's no prequel, and we increment, find sequel
        const sequel = findMediaEdge(media, "SEQUEL")?.node
        console.log(prequel, sequel)
    }

    return relatedMedia
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
