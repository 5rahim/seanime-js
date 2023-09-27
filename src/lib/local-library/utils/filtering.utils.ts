import { SPECIALIZED_RX } from "@/lib/series-scanner/regex"
import similarity from "string-similarity"

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
