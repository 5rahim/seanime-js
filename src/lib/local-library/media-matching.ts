"use server"
import { AnilistShortMedia, AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import _ from "lodash"
import { ordinalize } from "inflection"
import similarity from "string-similarity"
import lavenshtein from "js-levenshtein"
import { AnimeFileInfo, LocalFile } from "@/lib/local-library/local-file"
import { logger } from "@/lib/helpers/debug"
import { ScanLogging } from "@/lib/local-library/logs"
import { valueContainsSeason } from "@/lib/anilist/helpers.shared"

/**
 * This method employs 3 comparison algorithms: Dice's coefficient (string-similarity), Levenshtein's algorithm, and MAL's elastic search algorithm
 * - Get the media titles from 4 possibles values (userPreferred, english, romaji and synonyms that include seasons)
 * - Parse the title that will be used for comparison
 * - Parse a season
 * - Find variations of the title containing the seasons for comparison
 * - Find similar title in watch list from Dice's coefficient
 * - Find similar title in watch list from Levenshtein's algorithm
 * - Find similar title from MAL's elastic search
 * - From these 3 best matches, eliminate the least similar one using Dice's coefficient
 * - From these 2 best matches, find the most similar to the title using Dice's coefficient
 * - Compare the best match titles (===) to a media
 */
export async function findBestCorrespondingMedia({
                                                     file,
                                                     allMedia,
                                                     mediaTitles,
                                                     parsed,
                                                     parsedFolderInfo,
                                                     _matchingCache,
                                                     _scanLogging,
                                                 }: {
    file: LocalFile,
    allMedia: AnilistShortMedia[],
    mediaTitles: {
        eng: string[],
        rom: string[],
        preferred: string[],
        synonymsWithSeason: string[]
    },
    parsed: AnimeFileInfo,
    parsedFolderInfo: AnimeFileInfo[],
    _matchingCache: Map<string, AnilistShowcaseMedia | undefined>,
    _scanLogging: ScanLogging
}) {

    function debug(...value: any[]) {
        // if (parsed.original.toLowerCase().includes("(not)")) console.log(...value)
    }

    _scanLogging.add(file.path, ">>> [media-matching]")

    let folderParsed: AnimeFileInfo | undefined
    let rootFolderParsed: AnimeFileInfo | undefined

    if (parsedFolderInfo.length > 0) {
        folderParsed = parsedFolderInfo[parsedFolderInfo.length - 1]
        rootFolderParsed = parsedFolderInfo[parsedFolderInfo.length - 2]
        // console.log(rootFolderParsed)
    }

    /* Get constants */

    const mediaEngTitles = mediaTitles.eng
    const mediaRomTitles = mediaTitles.rom
    const mediaPreferredTitles = mediaTitles.preferred
    const mediaSynonymsWithSeason = mediaTitles.synonymsWithSeason

    const episodeAsNumber = (parsed.episode && _.isNumber(parseInt(parsed.episode)))
        ? parseInt(parsed.episode)
        : undefined
    const folderSeasonAsNumber = (folderParsed?.season && _.isNumber(parseInt(folderParsed.season)))
        ? parseInt(folderParsed.season)
        : undefined
    const seasonAsNumber = (parsed.season && _.isNumber(parseInt(parsed.season)))
        ? parseInt(parsed.season)
        : undefined
    const courAsNumber = (folderParsed?.cour && _.isNumber(parseInt(folderParsed.cour)))
        ? parseInt(folderParsed.cour)
        : (parsed.cour && _.isNumber(parseInt(parsed.cour))) ? parseInt(parsed.cour) : undefined
    const partAsNumber = (folderParsed?.part && _.isNumber(parseInt(folderParsed.part)))
        ? parseInt(folderParsed.part)
        : (parsed.part && _.isNumber(parseInt(parsed.part))) ? parseInt(parsed.part) : undefined

    /* Get all variations of title */

    // Get the parent folder title or root folder title
    const _folderTitle = (folderParsed?.title && folderParsed.title.length > 0)
        ? folderParsed.title
        : (rootFolderParsed?.title && rootFolderParsed.title.length > 0)
            ? rootFolderParsed.title
            : undefined

    // Get the title from the folders first
    const _title = _folderTitle || parsed.title

    const bothTitles = !!parsed.title && !!_folderTitle
    const noSeasonsOrParts = !seasonAsNumber && !folderSeasonAsNumber && !courAsNumber && !partAsNumber
    const bothTitlesAreSimilar = bothTitles && _folderTitle!.toLowerCase().includes(parsed.title!.toLowerCase())
    const eitherSeasonExists = !!seasonAsNumber || !!folderSeasonAsNumber
    const eitherSeasonIsFirst = (!!seasonAsNumber && seasonAsNumber <= 1) || (!!folderSeasonAsNumber && folderSeasonAsNumber <= 1)


    // Determine possible title variations based on different scenarios
    // The following code creates an array of potential title variations.
    // Each variation is created based on different conditions and combinations of title elements (seasons, etc...).
    let titleVariations = [
        (noSeasonsOrParts && _folderTitle) ? _folderTitle : undefined,
        (noSeasonsOrParts && parsed.title) ? parsed.title : undefined,
        (!!courAsNumber && _folderTitle) ? `${_folderTitle} Part ${courAsNumber}` : undefined, // Cour
        (!!courAsNumber && parsed.title) ? `${parsed.title} Part ${courAsNumber}` : undefined, // Cour
        (!!courAsNumber && _folderTitle) ? `${_folderTitle} Cour ${courAsNumber}` : undefined, // Cour
        (!!courAsNumber && parsed.title) ? `${parsed.title} Cour ${courAsNumber}` : undefined, // Cour
        (!!courAsNumber && _folderTitle) ? `${_folderTitle} Cour ${romanize(courAsNumber)}` : undefined, // Cour
        (!!courAsNumber && parsed.title) ? `${parsed.title} Cour ${romanize(courAsNumber)}` : undefined, // Cour
        (!!courAsNumber && _folderTitle) ? `${_folderTitle} Part ${romanize(courAsNumber)}` : undefined, // Cour
        (!!courAsNumber && parsed.title) ? `${parsed.title} Part ${romanize(courAsNumber)}` : undefined, // Cour

        (!!partAsNumber && _folderTitle) ? `${_folderTitle} Part ${partAsNumber}` : undefined, // Part
        (!!partAsNumber && parsed.title) ? `${parsed.title} Part ${partAsNumber}` : undefined, // Part
        (!!partAsNumber && _folderTitle) ? `${_folderTitle} Cour ${partAsNumber}` : undefined, // Part
        (!!partAsNumber && parsed.title) ? `${parsed.title} Cour ${partAsNumber}` : undefined, // Part
        (!!partAsNumber && _folderTitle) ? `${_folderTitle} Cour ${romanize(partAsNumber)}` : undefined, // Part
        (!!partAsNumber && parsed.title) ? `${parsed.title} Cour ${romanize(partAsNumber)}` : undefined, // Part
        (!!partAsNumber && _folderTitle) ? `${_folderTitle} Part ${romanize(partAsNumber)}` : undefined, // Part
        (!!partAsNumber && parsed.title) ? `${parsed.title} Part ${romanize(partAsNumber)}` : undefined, // Part

        (!!partAsNumber && _folderTitle && eitherSeasonExists) ? `${_folderTitle} Season ${seasonAsNumber || folderSeasonAsNumber} Cour ${partAsNumber}` : undefined, // Part + Season
        (!!partAsNumber && parsed.title && eitherSeasonExists) ? `${parsed.title} Season ${seasonAsNumber || folderSeasonAsNumber} Cour ${partAsNumber}` : undefined, // Part + Season
        (!!partAsNumber && _folderTitle && eitherSeasonExists) ? `${_folderTitle} Season ${seasonAsNumber || folderSeasonAsNumber} Part ${partAsNumber}` : undefined, // Part + Season
        (!!partAsNumber && parsed.title && eitherSeasonExists) ? `${parsed.title} Season ${seasonAsNumber || folderSeasonAsNumber} Part ${partAsNumber}` : undefined, // Part + Season

        ((_folderTitle && !parsed.title) || (!bothTitlesAreSimilar && eitherSeasonExists)) ? `${_folderTitle} Season ${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        ((_folderTitle && !parsed.title) || (!bothTitlesAreSimilar && eitherSeasonExists)) ? `${_folderTitle} S${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        ((_folderTitle && !parsed.title) || (!bothTitlesAreSimilar && eitherSeasonExists)) ? `${_folderTitle} ${ordinalize(String(seasonAsNumber || folderSeasonAsNumber))} Season` : undefined,

        (parsed.title && eitherSeasonExists) ? `${parsed.title} Season ${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        (parsed.title && eitherSeasonExists) ? `${parsed.title} S${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        (parsed.title && eitherSeasonExists) ? `${parsed.title} ${ordinalize(String(seasonAsNumber || folderSeasonAsNumber))} Season` : undefined,

        (bothTitles && !bothTitlesAreSimilar && eitherSeasonExists) ? `${_folderTitle} ${parsed.title} Season ${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        (bothTitles && !bothTitlesAreSimilar && eitherSeasonExists) ? `${_folderTitle} ${parsed.title} S${seasonAsNumber || folderSeasonAsNumber}` : undefined,
        (bothTitles && !bothTitlesAreSimilar && eitherSeasonExists) ? `${_folderTitle} ${parsed.title} ${ordinalize(String(seasonAsNumber || folderSeasonAsNumber))} Season` : undefined,
        (bothTitles && !bothTitlesAreSimilar && noSeasonsOrParts) ? `${_folderTitle} ${parsed.title}` : undefined,
        (_folderTitle && eitherSeasonIsFirst) ? _folderTitle : undefined,
        (parsed.title && eitherSeasonIsFirst) ? parsed.title : undefined,
    ].filter(Boolean)


    // Remove duplicates and convert to lowercase
    titleVariations = [...(new Set(titleVariations.map(value => value.toLowerCase())))]

    _scanLogging.add(file.path, "Created title variations")
    _scanLogging.add(file.path, "   -> " + JSON.stringify(titleVariations))

    // Check if titleVariations are already cached
    if (_matchingCache.has(JSON.stringify(titleVariations))) {
        logger("media-matching").success("Cache HIT:", _title, (seasonAsNumber || folderSeasonAsNumber) || "")
        _scanLogging.add(file.path, `Cache HIT`)
        _scanLogging.add(file.path, `   -> Media ID: ${_matchingCache.get(JSON.stringify(titleVariations))?.id}`)
        return {
            correspondingMedia: _matchingCache.get(JSON.stringify(titleVariations)),
        }
    }

    /* Using string-similarity */

    // Calculate similarity using string-similarity library
    // This section calculates the similarity of the title variations with media titles
    let similarTitleMatching = titleVariations.map((tValue) => {
        // Calculate best match for English titles, Romaji titles, preferred titles, and season titles
        const engResult = similarity.findBestMatch(tValue, mediaEngTitles.map(value => value.toLowerCase()))
        const romResult = similarity.findBestMatch(tValue, mediaRomTitles.map(value => value.toLowerCase()))
        const preferredResult = similarity.findBestMatch(tValue, mediaPreferredTitles.map(value => value.toLowerCase()))
        const seasonResult = similarity.findBestMatch(tValue, mediaSynonymsWithSeason.map(value => value.toLowerCase()))
        // Choose the best match out of the calculated results
        const bestResult = [engResult, romResult, preferredResult, seasonResult].reduce((prev, curr) => {
            return prev.bestMatch.rating >= curr.bestMatch.rating ? prev : curr // Higher rating
        })
        return { titleValue: tValue, bestResult }
    }) ?? []
    similarTitleMatching = _.sortBy(similarTitleMatching, n => n.bestResult.bestMatch.rating).reverse()

    const bestTitle = similarTitleMatching?.[0]?.bestResult

    let correspondingMediaUsingSimilarity = (bestTitle) ? allMedia.find(media => {
        return media.title?.userPreferred?.toLowerCase() === bestTitle.bestMatch.target.toLowerCase()
            || media.title?.english?.toLowerCase() === bestTitle.bestMatch.target.toLowerCase()
            || media.title?.romaji?.toLowerCase() === bestTitle.bestMatch.target.toLowerCase()
            || !!media.synonyms?.filter(Boolean).find(synonym => synonym.toLowerCase() === bestTitle.bestMatch.target.toLowerCase())
    }) : undefined

    _scanLogging.add(file.path, "Title matching using string-similarity")
    _scanLogging.add(file.path, "   -> Found " + JSON.stringify(correspondingMediaUsingSimilarity?.title))
    _scanLogging.add(file.path, "   -> Rating " + bestTitle?.bestMatch.rating)

    if (correspondingMediaUsingSimilarity) { // Unnecessary?
        delete correspondingMediaUsingSimilarity?.relations
    }

    /**
     * Using levenshtein
     */

    let correspondingMediaFromDistance: AnilistShortMedia | undefined

    _scanLogging.add(file.path, "Title matching using levenshtein")

    // Calculate Levenshtein distances and find the lowest for all title variations
    const distances = allMedia.flatMap(media => {
        return getDistanceFromTitle(media, titleVariations)
    })
    if (distances) {
        const lowest = distances.reduce((prev, curr) => prev.distance <= curr.distance ? prev : curr) // Lower distance
        correspondingMediaFromDistance = lowest.media // Find the corresponding media from the title with the lower distance
        _scanLogging.add(file.path, "   -> Found " + JSON.stringify(correspondingMediaFromDistance?.title))
        _scanLogging.add(file.path, "   -> Distance " + lowest.distance)
    } else {
        _scanLogging.add(file.path, `   -> Could not calculate distances`)
    }


    /* Using MAL */

    let correspondingMediaFromMAL: AnilistShowcaseMedia | undefined

    try {
        if (_title) {
            const url = new URL("https://myanimelist.net/search/prefix.json")
            url.searchParams.set("type", "anime")
            url.searchParams.set("keyword", titleVariations[0]) // Why titleVariations[0]? Because it changes depending on the availability of season
            const res = await fetch(url, { method: "GET" })
            const body: any = await res.json()
            // Find anime data from the response
            const anime = body?.categories?.find((category: any) => category?.type === "anime")?.items?.[0]
            // Check if the corresponding media exists in the user's list
            const correspondingInUserList = allMedia.find(media => media.idMal === anime.id)
            _scanLogging.add(file.path, "Title matching using MAL")
            _scanLogging.add(file.path, `   -> Title used for search: ` + titleVariations[0])
            if (anime && !!correspondingInUserList) {
                correspondingMediaFromMAL = correspondingInUserList
                _scanLogging.add(file.path, "   -> Found " + JSON.stringify(correspondingMediaFromMAL.title))
            } else {
                _scanLogging.add(file.path, "   -> warning - Could not find the MAL media in user watch list")
                _scanLogging.add(file.path, "   -> Found " + JSON.stringify(anime))
            }
        }
    } catch {

    }

    // Create an array of different media sources for comparison
    let differentFoundMedia = [correspondingMediaFromMAL, correspondingMediaUsingSimilarity, correspondingMediaFromDistance].filter(Boolean)

    // debug("------------------------------------------------------")
    // debug(titleVariations)
    // debug(differentFoundMedia.map(n => n.title?.userPreferred?.toLowerCase()).filter(Boolean))
    // debug(differentFoundMedia.map(n => n.title?.english?.toLowerCase()).filter(Boolean))
    // debug(differentFoundMedia.map(n => n.title?.romaji?.toLowerCase()).filter(Boolean))
    // debug("------------------------------------------------------")

    _scanLogging.add(file.path, "Eliminating the least similar title from each language from each method")

    // Eliminate duplicate and least similar elements from each langages
    const best_userPreferred = eliminateLeastSimilarElement(differentFoundMedia.map(n => n.title?.userPreferred?.toLowerCase()).filter(Boolean))
    const best_english = eliminateLeastSimilarElement(differentFoundMedia.map(n => n.title?.english?.toLowerCase()).filter(Boolean))
    const best_romaji = eliminateLeastSimilarElement(differentFoundMedia.map(n => n.title?.romaji?.toLowerCase()).filter(Boolean))
    const best_syn = eliminateLeastSimilarElement(differentFoundMedia.flatMap(n => n.synonyms?.filter(Boolean).filter(syn => valueContainsSeason(syn.toLowerCase()))).map(n => n?.toLowerCase()).filter(Boolean))
    // debug(best_userPreferred, "preferred")// debug(best_english, "english")// debug(best_romaji, "romaji")// debug(best_syn, "season synonym")

    _scanLogging.add(file.path, "   -> Determined best titles from 'userPreferred' -> " + JSON.stringify(best_userPreferred))
    _scanLogging.add(file.path, "   -> Determined best titles from 'english' -> " + JSON.stringify(best_english))
    _scanLogging.add(file.path, "   -> Determined best titles from 'romaji' -> " + JSON.stringify(best_romaji))
    _scanLogging.add(file.path, "   -> Determined best titles from 'synonyms' -> " + JSON.stringify(best_syn))

    _scanLogging.add(file.path, "Comparing best titles from all languages using string-similarity")
    // Compare each title variation with the best titles from different sources
    let bestTitleComparisons = titleVariations.filter(Boolean).map(title => {
        const matchingUserPreferred = best_userPreferred.length > 0 ? similarity.findBestMatch(title.toLowerCase(), best_userPreferred) : undefined
        const matchingEnglish = best_english.length > 0 ? similarity.findBestMatch(title.toLowerCase(), best_english) : undefined
        const matchingRomaji = best_romaji.length > 0 ? similarity.findBestMatch(title.toLowerCase(), best_romaji) : undefined
        const matchingSyn = best_syn.length > 0 ? similarity.findBestMatch(title.toLowerCase(), best_syn) : undefined

        if ([matchingUserPreferred, matchingEnglish, matchingRomaji, matchingSyn].filter(Boolean).length === 0) return undefined
        // Return the best match from all comparisons
        return [matchingUserPreferred, matchingEnglish, matchingRomaji, matchingSyn].filter(Boolean).reduce((prev, val) => {
            return val.bestMatch.rating >= prev.bestMatch.rating ? val : prev
        })
    }).filter(Boolean)

    // Determine the best title among the comparisons
    let bestTitleMatching = bestTitleComparisons.length > 0 ? bestTitleComparisons.reduce((prev, val) => {
        return val.bestMatch.rating >= prev.bestMatch.rating ? val : prev
    }) : undefined
    _scanLogging.add(file.path, "   -> Comparison " + JSON.stringify(bestTitleMatching))
    _scanLogging.add(file.path, "   -> Found " + JSON.stringify(bestTitleMatching?.bestMatch?.target))

    // Initialize variables to store the final rating and corresponding media
    let rating: number = 0
    let bestMedia: AnilistShowcaseMedia | undefined

    if (bestTitleMatching) {
        // Find the media with matching title
        bestMedia = allMedia.find(media => {
            if (media.title?.userPreferred?.toLowerCase() === bestTitleMatching!.bestMatch.target.toLowerCase()
                || media.title?.english?.toLowerCase() === bestTitleMatching!.bestMatch.target.toLowerCase()
                || media.title?.romaji?.toLowerCase() === bestTitleMatching!.bestMatch.target.toLowerCase()
                || !!media.synonyms?.filter(Boolean)?.some(synonym => synonym.toLowerCase() === bestTitleMatching!.bestMatch.target.toLowerCase())
            ) {
                rating = bestTitleMatching!.bestMatch.rating
                return true
            } else {
                return false
            }
        })
    }
    debug(bestTitleMatching?.bestMatch, "best", bestMedia)

    _scanLogging.add(file.path, `Found media`)
    _scanLogging.add(file.path, `   -> Media ID: ` + bestMedia?.id)
    _scanLogging.add(file.path, `   -> ` + JSON.stringify(bestMedia?.title))
    _scanLogging.add(file.path, `   -> Rating: ${rating}`)

    logger("media-matching").error("Cache MISS: [File title]", _title, `(${(seasonAsNumber || folderSeasonAsNumber || "-")})`, "| [Media title]", bestMedia?.title?.english, "| [Rating]", rating)
    // Adding it to the cache
    _matchingCache.set(JSON.stringify(titleVariations), bestMedia)

    if (+rating < 0.5) {
        _scanLogging.add(file.path, "warning - Rating is below the threshold, un-matched")
    }

    return {
        correspondingMedia: +rating >= 0.5 ? bestMedia : undefined,
    }
}

function getDistanceFromTitle(media: AnilistShowcaseMedia, values: string[]) {
    if (media && media.title) {

        const titles = Object.values(media.title).filter(Boolean).flatMap(title => values.map(unit => lavenshtein(title!.toLowerCase(), unit!.toLowerCase())))

        const synonymsWithSeason = media.synonyms?.filter(Boolean)
            .filter(valueContainsSeason)
            .flatMap(title => values.map(unit => lavenshtein(title.toLowerCase(), unit.toLowerCase()))) // If synonym has "season", remove padding

        const distances = [...(synonymsWithSeason || []), ...titles]
        const min = distances.length > 0 ? distances.reduce((prev, curr) => prev < curr ? prev : curr) : 999999999999999
        return {
            media,
            distance: min,
        } // Return the minimum distance
    }
    return {
        media: undefined,
        distance: 99999,
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
