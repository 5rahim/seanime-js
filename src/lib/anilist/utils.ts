import { AnilistShortMedia, AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { MediaRelation } from "@/gql/graphql"
import _ from "lodash"
import { AnilistCollectionEntry } from "@/atoms/anilist/entries.atoms"
import { LibraryEntry } from "@/atoms/library/library-entry.atoms"
import rakun from "@/lib/rakun"
import { valueContainsSeason } from "@/lib/local-library/utils"

type _RelationEdge = { relationType: MediaRelation, node: AnilistShowcaseMedia | null | undefined }

/**
 * @description
 * Returns an [AnilistShowcaseMedia] with the specified [MediaRelation] to the given media.
 * If the specified [MediaRelation] is "SEQUEL", it will look for OVAs if it can't find on first try.
 * /!\ Will not work with [AnilistShowcaseMedia] since the `media` parameter needs to contain `relations`
 */
export function findMediaEdge(media: AnilistShortMedia | null | undefined, relation: MediaRelation, formats = ["TV", "TV_SHORT"], skip: boolean = false): _RelationEdge | undefined {
    let res = (media?.relations?.edges as _RelationEdge[])?.find(edge => {
        if (edge?.relationType === relation) {
            return formats.includes(edge?.node?.format ?? "")
        }
        return false
    })
    // this is hit-miss
    if (!res && !skip && relation === "SEQUEL") {
        res = findMediaEdge(media, relation, formats = ["TV", "TV_SHORT", "OVA"], true)
    }
    return res
}

export function findMediaSeasonFromTitles(media: AnilistShortMedia | null | undefined) {
    const seasons = [
        rakun.parse(media?.title?.english || "")?.season,
        rakun.parse(media?.title?.romaji || "")?.season,
        rakun.parse(media?.title?.userPreferred || "")?.season,
        ...(media?.synonyms?.filter(valueContainsSeason).map(syn => {
            return rakun.parse(syn || "")?.season
        }) || []),
    ].filter(Boolean).map(n => Number(n))

    return _.head(seasons)
}

/**
 * Normalize [AnilistShortMedia] to [AnilistShowcaseMedia]
 * @param media
 */
export function shortMediaToShowcaseMedia(media: AnilistShortMedia | null | undefined): AnilistShowcaseMedia {
    return _.omit(media, "streamingEpisodes", "relations", "studio", "description", "source", "isAdult", "genres", "trailer", "countryOfOrigin", "studios")
}

export function filterEntriesByTitle<T extends AnilistCollectionEntry[] | LibraryEntry[]>(arr: T, input: string) {
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
