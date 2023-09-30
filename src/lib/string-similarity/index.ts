export interface Rating {
    target: string;
    rating: number;
}

export interface BestMatch {
    ratings: Rating[];
    bestMatch: Rating;
    bestMatchIndex: number;
}

export function compareTwoStrings(first: string, second: string): number {
    first = first.replace(/\s+/g, "")
    second = second.replace(/\s+/g, "")

    if (first === second) return 1 // identical or empty
    if (first.length < 2 || second.length < 2) return 0 // if either is a 0-letter or 1-letter string

    const firstBigrams = new Map<string, number>()
    for (let i = 0; i < first.length - 1; i++) {
        const bigram = first.substring(i, i + 2)
        const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram)! + 1 : 1
        firstBigrams.set(bigram, count)
    }

    let intersectionSize = 0
    for (let i = 0; i < second.length - 1; i++) {
        const bigram = second.substring(i, i + 2)
        const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram)! : 0

        if (count > 0) {
            firstBigrams.set(bigram, count - 1)
            intersectionSize++
        }
    }

    return (2.0 * intersectionSize) / (first.length + second.length - 2)
}

export function findBestMatch(mainString: string, targetStrings: string[]): BestMatch {
    const ratings: Rating[] = []
    let bestMatchIndex = 0

    for (let i = 0; i < targetStrings.length; i++) {
        const currentTargetString = targetStrings[i]
        const currentRating = compareTwoStrings(mainString, currentTargetString)
        ratings.push({ target: currentTargetString, rating: currentRating })
        if (currentRating > ratings[bestMatchIndex].rating) {
            bestMatchIndex = i
        }
    }

    const bestMatch = ratings[bestMatchIndex]

    return { ratings, bestMatch, bestMatchIndex }
}

export const similarity = {
    compareTwoStrings,
    findBestMatch,
}
