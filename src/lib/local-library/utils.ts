import { SPECIALIZED_RX } from "@/lib/series-scanner/regex"
import similarity from "string-similarity"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import lavenshtein from "js-levenshtein"
import { AnimeFileInfo } from "@/lib/local-library/types"

export function getLocalFileParsedSeason(parsedInfo: AnimeFileInfo | undefined, folderParsedInfo: AnimeFileInfo[]) {

    if (parsedInfo) {

        const folderParsedSeason = Number(folderParsedInfo.findLast(obj => !!obj.season)?.season)
        const folderSeason = !isNaN(folderParsedSeason) ? Number(folderParsedSeason) : undefined
        const fileSeason = !isNaN(Number(parsedInfo?.season)) ? Number(parsedInfo?.season) : undefined

        if (!!folderSeason && !!fileSeason) { // Prefer the file season when both exist
            return folderSeason !== fileSeason ? fileSeason : folderSeason
        }
        return folderSeason || fileSeason // Prefer the folder season when only one exists

    }

    return undefined

}

/**
 * @description
 * This does NOT return the normalized episode number, only the parsed one
 */
export function getLocalFileParsedEpisode(parsedInfo: AnimeFileInfo | undefined) {
    return (!!parsedInfo?.episode && !isNaN(Number(parsedInfo?.episode))) ? Number(parsedInfo.episode) : undefined
}

/**
 * @description
 * - This is primarily used to check if an AniList media synonym contains a season
 * - This is a good way to filter specific synonyms
 * @param value
 */
export const valueContainsSeason = (value: string | null | undefined) => (
    value?.toLowerCase()?.includes("season") ||
    value?.toLowerCase()?.match(/\d(st|nd|rd|th) [Ss].*/)
) && !value?.toLowerCase().includes("episode") && !value?.toLowerCase().includes("第") && !value?.toLowerCase().match(/\b(ova|special|special)\b/i)

/**
 * @description
 * Returns true if the given `value` matches any regex from `SPECIALIZED_RX.SPECIAL` and does not match any regex from `SPECIALIZED_RX.NC`
 * @param value
 */
export function valueContainsSpecials(value: string | null | undefined) {
    if (!value) return false
    return SPECIALIZED_RX.SPECIAL.some(rx => rx.test(value)) && !SPECIALIZED_RX.NC.some(rx => rx.test(value))
}

/**
 * @description
 * Returns true if the given `value` matches any regex from `SPECIALIZED_RX.NC`
 * @param value
 */
export function valueContainsNC(value: string | null | undefined) {
    if (!value) return false
    return SPECIALIZED_RX.NC.some(rx => rx.test(value))
}

/* -------------------------------------------------------------------------------------------------
 * Comparison
 * -----------------------------------------------------------------------------------------------*/

/**
 * @description Purpose
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
export function compareTitleVariationsToMediaTitles(media: AnilistShowcaseMedia, variations: string[]) {
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
 * @example
 * const result = compareValuesToTitle("Mononogatari", ["Mononogatari", "Jujutsu Kaisen"])
 * //=> { value: "Mononogatari", distance: 0 }
 */
export function compareValuesToTitle(title: string, values: string[]): {
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

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/

/**
 * @example
 * toRomanNumber(2) //=> II
 */
export function toRomanNumber(num: number) {
    try {
        if (isNaN(num))
            return num
        let digits = String(+num).split(""),
            key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM",
                "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC",
                "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"],
            roman = "",
            i = 3
        while (i--)
            roman = (key[+digits.pop()! + (i * 10)] || "") + roman
        return Array(+digits.join("") + 1).join("M") + roman
    } catch (e) {
        return ""
    }
}

/**
 * @description For arrays of 3 or more elements
 * @example
 * eliminateLeastSimilarValue(["One Piece - Film Z", "One Piece: Film Z", "One Piece Gold"])
 * //=> ["One Piece - Film Z", "One Piece: Film Z"]
 */
export function eliminateLeastSimilarValue(arr: string[]): string[] {

    if (!arr.length || arr.length <= 2) return arr

    let leastSimilarIndex = -1
    let leastSimilarScore = Number.MAX_VALUE

    for (let i = 0; i < arr.length; i++) {
        let totalSimilarity = 0

        for (let j = 0; j < arr.length; j++) {
            if (i !== j) {
                const score = similarity.compareTwoStrings(arr[i], arr[j])
                totalSimilarity += score
            }
        }

        if (totalSimilarity < leastSimilarScore) {
            leastSimilarScore = totalSimilarity
            leastSimilarIndex = i
        }
    }

    if (leastSimilarIndex !== -1) {
        arr.splice(leastSimilarIndex, 1)
    }

    return arr
}
