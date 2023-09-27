import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import lavenshtein from "js-levenshtein"
import { valueContainsSeason } from "@/lib/local-library/utils/filtering.utils"

/**
 * @description Purpose
 * - Uses **lavenshtein**
 * - Compares given `variations` to the specific [AnilistShowcaseMedia+] titles and synonyms and returns the lowest distance
 * - The `variations` value is supposed to be an array of **related** titles
 * @example
 * // media = { title: { english: "Jujutsu Kaisen", romaji: "Jujutsu Kaisen" }, ... }
 *
 * const res = compareTitleVariationsToMediaTitles(media, ["Bungo Stray Dogs", ...])
 * //=> { media, distance: 23 }
 * const res = compareTitleVariationsToMediaTitles(media, ["Jujutsu Kaisen", "Jujutsu Kaisen Season 1"])
 * //=> { media, distance: 0 }
 */
export function matching_compareTitleVariationsToMedia(media: AnilistShowcaseMedia, variations: string[]) {
    if (media && media.title) {

        const titleDistances = Object.values(media.title).filter(Boolean).flatMap(title => variations.map(unit => lavenshtein(title!.toLowerCase(), unit!.toLowerCase())))

        const synonymDistances = media.synonyms?.filter(Boolean)
            .filter(valueContainsSeason)
            .flatMap(title => variations.map(unit => lavenshtein(title.toLowerCase(), unit.toLowerCase())))

        const distances = [...(synonymDistances || []), ...titleDistances]

        // Return the minimum distance
        const min = distances.length > 0 ? distances.reduce((prev, curr) => prev < curr ? prev : curr) : 99999

        return {
            media,
            distance: min,
        }
    }
    return {
        media: undefined,
        distance: 99999,
    }
}

/**
 * @description Purpose
 * - Uses **lavenshtein**
 * - Returns the value with the lowest distance compared to the given `title`
 * - Here the `values` are supposed to not be related
 * @description Use
 * - Use it to filter out suggestions. Here, `values` could be titles from fetched suggestions
 * @example
 * const result = matching_getBestMatchFromTitleComparison("Mononogatari", ["Mononogatari", "Jujutsu Kaisen"])
 * //=> { value: "Mononogatari", distance: 0 }
 */
export function matching_getBestMatchFromTitleComparison(title: string, values: string[]): {
    value: string | undefined,
    distance: number | undefined
} {

    const results = values.map(unit => ({
        value: unit,
        distance: lavenshtein(title.toLowerCase(), unit.toLowerCase()),
    }))

    // Return the value with the lowest distance
    return results.length > 0 ? results.reduce((prev, curr) => prev.distance < curr.distance ? prev : curr) : {
        value: undefined,
        distance: undefined,
    }
}
