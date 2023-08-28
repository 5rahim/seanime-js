"use server"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeShortMediaByIdDocument, UpdateEntryDocument, UpdateEntryMutationVariables } from "@/gql/graphql"
import { logger } from "@/lib/helpers/debug"
import { AnilistShortMedia } from "@/lib/anilist/fragment"
import { findMediaEdge } from "@/lib/anilist/utils"

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

/**
 * {@link https://github.com/ThaUnknown/miru/blob/master/src/renderer/modules/anime.js#L317}
 * @param opts
 */
export async function resolveSeason(opts: {
    media: AnilistShortMedia | null | undefined,
    episode?: number | null,
    increment?: boolean | null,
    offset?: number,
    rootMedia?: AnilistShortMedia,
    force?: boolean
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
    media = (await useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: edge.id })).Media!

    const highest = media.nextAiringEpisode?.episode || media.episodes!

    const diff = episode! - (highest + offset)
    offset += increment ? rootHighest : highest
    if (increment) rootMedia = media

    // force marches till end of tree, no need for checks
    if (!force && diff <= rootHighest) {
        episode! -= offset
        return { media, episode, offset, increment, rootMedia }
    }

    return resolveSeason({ media, episode, increment, offset, rootMedia, force })
}
