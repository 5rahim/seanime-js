import { AnilistDetailedMedia, AnilistShortMedia, AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { MediaRelation } from "@/gql/graphql"
import _ from "lodash"
import { AnilistCollectionEntry } from "@/atoms/anilist/entries.atoms"
import { LibraryEntry } from "@/atoms/library/library-entry.atoms"

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

/**
 * Normalize [AnilistShortMedia] to [AnilistShowcaseMedia]
 * @param media
 */
export function shortMediaToShowcaseMedia(media: AnilistShortMedia): AnilistShowcaseMedia {
    return _.omit(media, "streamingEpisodes", "relations", "studio", "description", "format", "source", "isAdult", "genres", "trailer", "countryOfOrigin", "studios")
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

/**
 * Create title variations from a media titles and synonyms
 * @param media
 */
export function getAnilistMediaTitleList(media: AnilistShortMedia | AnilistDetailedMedia) {
    if (!media.title) return undefined

    const grouped = [
        ...new Set(
            Object.values(media.title)
                .concat(media.synonyms ?? [])
                .filter(name => name != null && name.length > 3),
        ),
    ]
    const titles: string[] = []
    const appendTitle = (t: string) => {
        // replace & with encoded
        const title = t.replace(/&/g, "%26").replace(/\?/g, "%3F").replace(/#/g, "%23")
        titles.push(title)

        // replace Season 2 with S2, else replace 2nd Season with S2, but keep the original title
        const match1 = title.match(/(\d)(?:nd|rd|th) Season/i)
        const match2 = title.match(/Season (\d)/i)

        if (match2) {
            titles.push(title.replace(/Season \d/i, `S${match2[1]}`))
        } else if (match1) {
            titles.push(title.replace(/(\d)(?:nd|rd|th) Season/i, `S${match1[1]}`))
        }
    }
    for (const t of grouped) {
        if (t) {
            appendTitle(t)
            if (t.includes("-")) appendTitle(t.replaceAll("-", ""))
        }
    }
    return titles
}
