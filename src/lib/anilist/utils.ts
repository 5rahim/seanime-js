import { AnilistShortMedia, AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { MediaRelation } from "@/gql/graphql"
import { AnilistCollectionEntry } from "@/atoms/anilist/entries.atoms"
import { LibraryEntry } from "@/atoms/library/library-entry.atoms"
import rakun from "@/lib/rakun"
import { valueContainsSeason } from "@/lib/local-library/utils"
import head from "lodash/head"
import omit from "lodash/omit"
import { logger } from "@/lib/helpers/debug"

type _AnilistRelationEdge = { relationType: MediaRelation, node: AnilistShowcaseMedia | null | undefined }

/**
 * @description
 * - Returns a [AnilistShowcaseMedia] with the specified [MediaRelation] to the given media.
 * - If the specified [MediaRelation] is "SEQUEL", it will look for OVAs if it can't find on first try.
 * - /!\ Will not work with [AnilistShowcaseMedia] since the `media` parameter needs to contain `relations`
 */
export function anilist_findMediaEdge(
    media: AnilistShortMedia | null | undefined,
    relation: MediaRelation,
    formats = ["TV", "TV_SHORT"],
    stop: boolean = false,
): _AnilistRelationEdge | undefined {
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
    if (!res && !stop && relation === "SEQUEL") {
        res = anilist_findMediaEdge(media, relation, formats = ["TV", "TV_SHORT", "OVA"], true)
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

    return head(seasons)
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
