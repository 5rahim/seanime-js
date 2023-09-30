import { AnilistShortMedia, AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { MediaFormat, MediaRelation } from "@/gql/graphql"
import { AnilistCollectionEntry } from "@/atoms/anilist/entries.atoms"
import { LibraryEntry } from "@/atoms/library/library-entry.atoms"
import rakun from "@/lib/rakun"
import omit from "lodash/omit"
import { logger } from "@/lib/helpers/debug"
import { Nullish } from "@/types/common"
import { valueContainsSeason } from "@/lib/local-library/utils/filtering.utils"

type _AnilistRelationEdge = { relationType: MediaRelation, node: AnilistShowcaseMedia | null | undefined }

/**
 * @description
 * - Returns a [AnilistShowcaseMedia] with the specified [MediaRelation] to the given media.
 * - If the specified [MediaRelation] is "SEQUEL", it will look for OVAs if it can't find on first try.
 * - /!\ Will not work with [AnilistShowcaseMedia] since the `media` parameter needs to contain `relations`
 */
export function anilist_findMediaEdge(props: {
    media: AnilistShortMedia | null | undefined,
    relation: MediaRelation,
    formats?: MediaFormat[],
    force?: boolean,
    forceFormats?: MediaFormat[],
}): _AnilistRelationEdge | undefined {

    const {
        media,
        relation,
        formats = ["TV", "TV_SHORT"],
        force = true,
        forceFormats = ["TV", "TV_SHORT", "OVA", "ONA", "SPECIAL"],
    } = props

    if (media?.relations === undefined) {
        logger("lib/anilist/findMediaEdge").warning("media.relations is undefined")
        return undefined
    }

    let res = (media?.relations?.edges as _AnilistRelationEdge[])?.find(edge => {
        if (edge?.relationType === relation) {
            return formats.includes(edge?.node?.format ?? "")
        }
        return false
    })
    // this is hit-miss
    if (!res && force && relation === "SEQUEL") {
        res = anilist_findMediaEdge({ media, relation, formats: forceFormats, force: false })
    }
    return res
}

export function anilist_findMediaSeasonFromTitles(media: AnilistShortMedia | null | undefined) {
    const seasons = [
        rakun.parse(media?.title?.english || "")?.season,
        rakun.parse(media?.title?.romaji || "")?.season,
        rakun.parse(media?.title?.userPreferred || "")?.season,
        ...(media?.synonyms?.filter(valueContainsSeason).map(syn => {
            return rakun.parse(syn || "")?.season
        }) || []),
    ].filter(Boolean).map(n => Number(n))

    return seasons[0]
}

/**
 * Normalize [AnilistShortMedia] to [AnilistShowcaseMedia]
 * @param media
 */
export function anilist_shortMediaToShowcaseMedia(media: AnilistShortMedia | null | undefined): AnilistShowcaseMedia {
    return omit(media, "streamingEpisodes", "relations", "studio", "description", "source", "isAdult", "genres", "trailer", "countryOfOrigin", "studios")
}

export function anilist_filterEntriesByTitle<T extends AnilistCollectionEntry[] | LibraryEntry[]>(arr: T, input: string) {
    if (arr.length > 0 && input.length > 0) {
        const _input = input.toLowerCase().trim().replace(/\s+/g, " ")
        return (arr as { media: AnilistShowcaseMedia | null | undefined }[]).filter(entry => (
            entry.media?.title?.english?.toLowerCase().includes(_input)
            || entry.media?.title?.userPreferred?.toLowerCase().includes(_input)
            || entry.media?.title?.romaji?.toLowerCase().includes(_input)
            || entry.media?.synonyms?.some(syn => syn?.toLowerCase().includes(_input))
        )) as T
    }
    return arr
}

/**
 * @description
 * - Returns the total episode count or current ceiling if media is releasing
 * - Returns 0 if nothing is defined
 * @param media
 */
export function anilist_getEpisodeCeilingFromMedia<T extends AnilistShowcaseMedia>(media: T | null | undefined) {
    if (!media) return 0
    return !!media.nextAiringEpisode?.episode ? media.nextAiringEpisode?.episode - 1 : (media.episodes || 0)
}

/**
 * @description
 * - Returns `true` if user has not watched all episodes
 */
export function anilist_canTrackProgress<T extends AnilistShowcaseMedia>(media: T, progress: Nullish<number>) {
    const maxEp = anilist_getEpisodeCeilingFromMedia(media)
    return maxEp > 0 && (!progress || progress < maxEp)
}

/**
 * @description
 * - Returns the next episode number to watch based on current progress
 * - Fallback if the user has watched everything => status === "RELEASING" ? maxEp : 1
 * @param media
 * @param currentProgress
 */
export function anilist_getNextEpisodeToWatch<T extends AnilistShowcaseMedia>(media: T, currentProgress: Nullish<number>) {
    const _currentProgress = currentProgress ?? 0
    const maxEp = anilist_getEpisodeCeilingFromMedia(media)
    const fallback = media.status === "RELEASING" ? maxEp : 1
    return ((_currentProgress + 1) <= maxEp ? _currentProgress + 1 : fallback)
}
