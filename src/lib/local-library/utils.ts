import { SPECIALIZED_RX } from "@/lib/series-scanner/regex"
import similarity from "string-similarity"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import lavenshtein from "js-levenshtein"
import { AnimeFileInfo } from "@/lib/local-library/types"

export function getLocalFileParsedSeason(fileParsed: AnimeFileInfo | undefined, folderParsed: AnimeFileInfo[]) {

    if (fileParsed) {

        const folderParsedSeason = Number(folderParsed.findLast(obj => !!obj.season)?.season)
        const folderSeason = !isNaN(folderParsedSeason) ? Number(folderParsedSeason) : undefined
        const fileSeason = !isNaN(Number(fileParsed?.season)) ? Number(fileParsed?.season) : undefined

        if (!!folderSeason && !!fileSeason) {
            return folderSeason !== fileSeason ? fileSeason : folderSeason
        }
        return folderSeason || fileSeason

    }

    return undefined

}

/**
 * This does NOT return the normalized episode number
 */
export function getLocalFileParsedEpisode(parsedInfo: AnimeFileInfo | undefined) {
    return (!!parsedInfo?.episode && !isNaN(Number(parsedInfo?.episode))) ? Number(parsedInfo.episode) : undefined
}

export const valueContainsSeason = (value: string | null | undefined) => (
    value?.toLowerCase()?.includes("season") ||
    value?.toLowerCase()?.match(/\d(st|nd|rd|th) [Ss].*/)
) && !value?.toLowerCase().includes("episode") && !value?.toLowerCase().includes("第") && !value?.toLowerCase().match(/\b(ova|special|special)\b/i)

export function valueContainsSpecials(value: string | null | undefined) {
    if (!value) return false
    return SPECIALIZED_RX.SPECIAL.some(rx => rx.test(value)) && !SPECIALIZED_RX.NC.some(rx => rx.test(value))
}

export function valueContainsNC(value: string | null | undefined) {
    if (!value) return false
    return SPECIALIZED_RX.NC.some(rx => rx.test(value))
}

/* -------------------------------------------------------------------------------------------------
 * Comparison
 * -----------------------------------------------------------------------------------------------*/

/**
 * Compares given `variations` with the specific `media` titles and synonyms and returns the lowest distance
 * /!\ Here `variations` are supposed to be related
 * @example
 * // media.title = { english: "Jujutsu Kaisen", romaji: "Jujutsu Kaisen" }
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
 * Returns the value with the lowest distance compared to the given `title`
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
