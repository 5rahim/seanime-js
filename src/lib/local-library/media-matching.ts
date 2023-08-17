"use server"
import { AnilistMedia, AnilistSimpleMedia } from "@/lib/anilist/fragment"
import _ from "lodash"
import { ordinalize } from "inflection"
import similarity from "string-similarity"
import lavenshtein from "js-levenshtein"
import { AnimeFileInfo } from "@/lib/local-library/local-file"

/**
 * This method employs 3 comparison algorithms: Dice's coefficient (string-similarity), Levenshtein's algorithm, and MAL's elastic search algorithm
 * - Get the media titles from 3 possibles values (userPreferred, english, and romaji)
 * - Parse the title that will be used for comparison
 * - Parse a season
 * - Find variations of the title containing the seasons for comparison
 * - Find similar title in watch list from Dice's coefficient
 * - Find similar title in watch list from Levenshtein's algorithm
 * - Find similar title from MAL's elastic search
 * - From these 3 best matches, eliminate the least similar one using Dice's coefficient
 * - From these 2 best matches, find the most similar to the title using Dice's coefficient
 * - Compare the best match titles (===) to a media
 * @param allMedia
 * @param parsed
 * @param foldersParsed
 */
export async function findBestCorrespondingMedia(allMedia: AnilistMedia[], parsed: AnimeFileInfo, foldersParsed: AnimeFileInfo[]) {


    function debug(...value: any[]) {
        // if (parsed.original.toLowerCase().includes("evangelion")) console.log(...value)
    }

    let folderParsed: AnimeFileInfo | undefined
    let rootFolderParsed: AnimeFileInfo | undefined

    if (foldersParsed.length > 0) {
        folderParsed = foldersParsed[foldersParsed.length - 1]
        rootFolderParsed = foldersParsed[foldersParsed.length - 2]
        // console.log(rootFolderParsed)
    }

    /* Get constants */

    const mediaEngTitles = allMedia.map(media => media.title?.english).filter(Boolean)
    const mediaRomTitles = allMedia.map(media => media.title?.romaji).filter(Boolean)
    const mediaPreferredTitles = allMedia.map(media => media.title?.userPreferred).filter(Boolean)

    const episodeAsNumber = (parsed.episode && _.isNumber(parseInt(parsed.episode)))
        ? parseInt(parsed.episode)
        : undefined
    const folderSeasonAsNumber = (folderParsed?.season && _.isNumber(parseInt(folderParsed.season)))
        ? parseInt(folderParsed.season)
        : undefined
    const seasonAsNumber = (parsed.season && _.isNumber(parseInt(parsed.season)))
        ? parseInt(parsed.season)
        : undefined

    /* Get all variations of title */

    // Get the parent folder title or root folder title
    const _folderTitle = (folderParsed?.title && folderParsed.title.length > 0)
        ? folderParsed.title
        : (rootFolderParsed?.title && rootFolderParsed.title.length > 0)
            ? rootFolderParsed.title
            : undefined

    // Get the title from the folder first
    const _title = _folderTitle || parsed.title
    // Use these titles if we managed to parse a season
    // eg: ANIME S02 \ ANIME 25.mp4 -> ["ANIME Season 2", "ANIME S2"]
    // eg: ANIME \ ANIME S02E01.mp4 -> ["ANIME Season 2", "ANIME S2"]
    // eg: ANIME \ ANIME 25.mp4 -> undefined

    const bothTitles = !!parsed.title && !!_folderTitle
    const noSeasons = !seasonAsNumber && !folderSeasonAsNumber
    const bothTitlesAreSimilar = bothTitles && _folderTitle!.toLowerCase().includes(parsed.title!.toLowerCase())
    const eitherSeasonExists = !!seasonAsNumber || !!folderSeasonAsNumber
    const eitherSeasonIsFirst = (!!seasonAsNumber && seasonAsNumber <= 1) || (!!folderSeasonAsNumber && folderSeasonAsNumber <= 1)


    let titleVariations = [
        (noSeasons && _folderTitle) ? _folderTitle : undefined,
        (noSeasons && parsed.title) ? parsed.title : undefined,
        (bothTitles && !bothTitlesAreSimilar && noSeasons) ? `${_folderTitle} ${parsed.title}` : undefined,

        (_folderTitle && eitherSeasonIsFirst) ? _folderTitle : undefined,
        (parsed.title && eitherSeasonIsFirst) ? parsed.title : undefined,

        // (There is a folder title BUT no file Title) OR (there is a folder title and that title is not in the file title)  -> Use folder title
        ((_folderTitle && !parsed.title) || (!bothTitlesAreSimilar && eitherSeasonExists)) ? `${_folderTitle} Season ${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        ((_folderTitle && !parsed.title) || (!bothTitlesAreSimilar && eitherSeasonExists)) ? `${_folderTitle} Part ${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        ((_folderTitle && !parsed.title) || (!bothTitlesAreSimilar && eitherSeasonExists)) ? `${_folderTitle} Cour ${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        ((_folderTitle && !parsed.title) || (!bothTitlesAreSimilar && eitherSeasonExists)) ? `${_folderTitle} Part ${romanize(seasonAsNumber || folderSeasonAsNumber!)}` : undefined,
        ((_folderTitle && !parsed.title) || (!bothTitlesAreSimilar && eitherSeasonExists)) ? `${_folderTitle} S${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        ((_folderTitle && !parsed.title) || (!bothTitlesAreSimilar && eitherSeasonExists)) ? `${_folderTitle} ${ordinalize(String(seasonAsNumber || folderSeasonAsNumber))} Season` : undefined,
        (parsed.title && eitherSeasonExists) ? `${parsed.title} Season ${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        (parsed.title && eitherSeasonExists) ? `${parsed.title} Part ${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        (parsed.title && eitherSeasonExists) ? `${parsed.title} Cour ${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        (parsed.title && eitherSeasonExists) ? `${parsed.title} Part ${romanize(seasonAsNumber || folderSeasonAsNumber!)}` : undefined,
        (parsed.title && eitherSeasonExists) ? `${parsed.title} S${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        (parsed.title && eitherSeasonExists) ? `${parsed.title} ${ordinalize(String(seasonAsNumber || folderSeasonAsNumber))} Season` : undefined,
        // (There is a folder AND a file title) BUT (the folder title is not in the file title) -> Combine the two
        (bothTitles && !bothTitlesAreSimilar && eitherSeasonExists) ? `${_folderTitle} ${parsed.title} Season ${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        (bothTitles && !bothTitlesAreSimilar && eitherSeasonExists) ? `${_folderTitle} ${parsed.title} Part ${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        (bothTitles && !bothTitlesAreSimilar && eitherSeasonExists) ? `${_folderTitle} ${parsed.title} Cour ${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        (bothTitles && !bothTitlesAreSimilar && eitherSeasonExists) ? `${_folderTitle} ${parsed.title} Part ${romanize(seasonAsNumber || folderSeasonAsNumber!)}` : undefined,
        (bothTitles && !bothTitlesAreSimilar && eitherSeasonExists) ? `${_folderTitle} ${parsed.title} S${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        (bothTitles && !bothTitlesAreSimilar && eitherSeasonExists) ? `${_folderTitle} ${parsed.title} ${ordinalize(String(seasonAsNumber || folderSeasonAsNumber))} Season` : undefined,
    ].filter(Boolean)

    // Handle movie
    titleVariations = titleVariations?.map(value => value.toLowerCase())

    /**
     * Using string-similarity
     */

    let similarTitleMatching = titleVariations?.filter(Boolean).map((tValue) => {
        const engResult = similarity.findBestMatch(tValue, mediaEngTitles.map(value => value.toLowerCase()))
        const romResult = similarity.findBestMatch(tValue, mediaRomTitles.map(value => value.toLowerCase()))
        const preferredResult = similarity.findBestMatch(tValue, mediaPreferredTitles.map(value => value.toLowerCase()))
        const bestResult = [engResult, romResult, preferredResult].reduce((prev, curr) => {
            return prev.bestMatch.rating >= curr.bestMatch.rating ? prev : curr // Higher rating
        })
        return { titleVale: tValue, bestResult }
    }) ?? []
    similarTitleMatching = _.sortBy(similarTitleMatching, n => n.bestResult.bestMatch.rating).reverse()

    const bestResult = similarTitleMatching?.[0]?.bestResult

    let correspondingMediaUsingSimilarity = (bestResult) ? allMedia.find(media => {
        return media.title?.userPreferred?.toLowerCase() === bestResult.bestMatch.target.toLowerCase()
            || media.title?.english?.toLowerCase() === bestResult.bestMatch.target.toLowerCase()
            || media.title?.romaji?.toLowerCase() === bestResult.bestMatch.target.toLowerCase()
    }) : undefined

    delete correspondingMediaUsingSimilarity?.relations

    /**
     * Using levenshtein
     */

    let correspondingMediaFromDistance: AnilistMedia | undefined

    const distances = allMedia.flatMap(media => {
        return getDistanceFromTitle(media, titleVariations)!
    })
    if (distances) {
        const lowest = distances.reduce((prev, curr) => prev.distance <= curr.distance ? prev : curr) // Lower distance
        correspondingMediaFromDistance = lowest.media
    }

    /**
     * Using MAL
     */

    let correspondingMediaFromMAL: AnilistSimpleMedia | undefined

    try {
        if (_title) {
            const url = new URL("https://myanimelist.net/search/prefix.json")
            url.searchParams.set("type", "anime")
            url.searchParams.set("keyword", _title)
            const res = await fetch(url, { method: "GET" })
            const body: any = await res.json()
            const anime = body?.categories?.find((category: any) => category?.type === "anime")?.items?.[0]
            const corresponding = allMedia.find(media => media.idMal === anime.id)
            if (anime && !!corresponding) {
                correspondingMediaFromMAL = corresponding
            }
        }
    } catch {

    }

    let differentFoundMedia = [correspondingMediaFromMAL, correspondingMediaUsingSimilarity, correspondingMediaFromDistance].filter(Boolean)


    debug("-----------------------------------------------------")

    const best_userPreferred = eliminateLeastSimilarElement(differentFoundMedia.map(n => n.title?.userPreferred?.toLowerCase()).filter(Boolean))
    const best_english = eliminateLeastSimilarElement(differentFoundMedia.map(n => n.title?.english?.toLowerCase()).filter(Boolean))
    const best_romaji = eliminateLeastSimilarElement(differentFoundMedia.map(n => n.title?.romaji?.toLowerCase()).filter(Boolean))

    debug(titleVariations)
    debug("-------------------")

    debug(differentFoundMedia.map(n => n.title?.userPreferred?.toLowerCase()).filter(Boolean))
    debug(differentFoundMedia.map(n => n.title?.english?.toLowerCase()).filter(Boolean))
    debug(differentFoundMedia.map(n => n.title?.romaji?.toLowerCase()).filter(Boolean))

    debug("------------------------------------------------------")

    // debug(best_userPreferred)
    // debug(best_english)
    // debug(best_romaji)

    let bestArr = titleVariations.filter(Boolean).map(title => {
        const matchingUserPreferred = best_userPreferred.length > 0 ? similarity.findBestMatch(title.toLowerCase(), best_userPreferred) : undefined
        const matchingEnglish = best_english.length > 0 ? similarity.findBestMatch(title.toLowerCase(), best_english) : undefined
        const matchingRomaji = best_romaji.length > 0 ? similarity.findBestMatch(title.toLowerCase(), best_romaji) : undefined

        if ([matchingUserPreferred, matchingEnglish, matchingRomaji].filter(Boolean).length === 0) return undefined

        return [matchingUserPreferred, matchingEnglish, matchingRomaji].filter(Boolean).reduce((prev, val) => {
            return val.bestMatch.rating >= prev.bestMatch.rating ? val : prev
        })
    }).filter(Boolean)

    let best = bestArr.length > 0 ? bestArr.reduce((prev, val) => {
        return val.bestMatch.rating >= prev.bestMatch.rating ? val : prev
    }) : undefined

    let rating: number = 0
    let bestMedia: AnilistSimpleMedia | undefined

    if (best) {
        bestMedia = allMedia.find(media => {
            // Sometimes torrents are released by episode number and not grouped by season
            // So remove preceding seasons
            if (!(seasonAsNumber || folderSeasonAsNumber) && media.episodes && episodeAsNumber) {
                if (episodeAsNumber > media.episodes) return false
            }
            if (media.title?.userPreferred?.toLowerCase() === best!.bestMatch.target.toLowerCase()
                || media.title?.english?.toLowerCase() === best!.bestMatch.target.toLowerCase()
                || media.title?.romaji?.toLowerCase() === best!.bestMatch.target.toLowerCase()) {
                // console.log(titleVariations, media.title?.romaji?.toLowerCase(), best!.bestMatch.rating)
                rating = best!.bestMatch.rating
                return true
            } else {
                return false
            }
        })
    }

    // debug(titleVariations, bestMedia?.title)

    return {
        correspondingMedia: +rating >= 0.5 ? bestMedia : undefined,
    }
}

function getDistanceFromTitle(media: AnilistSimpleMedia, values: string[]) {
    if (media && media.title) {
        const titles = Object.values(media.title).filter(v => !!v).flatMap(title => values.map(unit => lavenshtein(title!.toLowerCase(), unit!.toLowerCase())))
        const synonyms = media.synonyms?.filter(v => !!v).flatMap(title => values.map(unit => lavenshtein(title!.toLowerCase(), unit!.toLowerCase()) + 2))
        const distances = [...titles, ...(synonyms || [])]
        const min = distances.length > 0 ? distances.reduce((prev, curr) => prev < curr ? prev : curr) : 999999999999999
        return {
            media,
            distance: min,
        } // Return the minimum distance
    }
}

function romanize(num: number) {
    try {
        if (isNaN(num))
            return NaN
        var digits = String(+num).split(""),
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

function eliminateLeastSimilarElement(arr: string[]): string[] {

    if (arr.length === 1) return arr
    if (arr.length === 2) return arr

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
