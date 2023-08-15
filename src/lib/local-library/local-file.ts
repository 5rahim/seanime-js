"use server"
import rakun from "@/lib/rakun/rakun"
import { Settings } from "@/atoms/settings"
import { AnilistMedia, AnilistSimpleMedia } from "@/lib/anilist/fragment"
import similarity from "string-similarity"
import _ from "lodash"
import lavenshtein from "js-levenshtein"
import { ordinalize } from "inflection"

export type AnimeFileInfo = {
    original: string
    title: string
    releaseGroup?: string
    season?: string
    part?: string
    // Episode (or episode range)
    episode?: string
}

export type LocalFile = {
    name: string // File name
    path: string // File path
    parsedFolders: AnimeFileInfo[]
    parsedInfo: AnimeFileInfo | undefined // Parsed anime info
}

/**
 * [LocalFile] represents a file on the host machine.
 * - Use [path] to identity the file
 *
 * - parsedInfo: Parsed info from the file name
 *      - Is undefined if we can't parse a title from the file name or folders
 *      - It is undefined if we can't parse an episode
 * - parsedFolders: Parsed info from each parent folder
 *      - Is undefined if we can't parse a title or a season
 */
export const createLocalFile = async (settings: Settings, props: Pick<LocalFile, "name" | "path">): Promise<LocalFile> => {

    try {
        const folderPath = props.path.replace(props.name, "").replace(settings.library.localDirectory || "", "")
        const parsed = rakun.parse(props.name)

        const folders = folderPath.split("\\").filter(value => !!value && value.length > 0)
        const parsedFolders = folders.map(folder => {
            const obj = rakun.parse(folder)
            // Keep the folder which has a parsed title or parsed season
            if (obj.name || obj.season) {
                return ({
                    original: folder,
                    title: obj.name,
                    releaseGroup: obj.subber,
                    season: obj.season,
                    part: obj.part,
                    episode: obj.episode,
                })
            }
        }).filter(Boolean)

        const branchHasTitle = !!parsed.name || parsedFolders.some(obj => !!obj.title)
        // const episodeIsValid = !!parsed.episode

        return {
            path: props.path,
            name: props.name,
            parsedInfo: (branchHasTitle) ? {
                original: parsed.filename,
                title: parsed.name,
                releaseGroup: parsed.subber,
                season: parsed.season,
                part: parsed.part,
                episode: parsed.episode,
            } : undefined,
            parsedFolders,
        }
    } catch (e) {
        console.error("[LocalFile] Parsing error", e)

        return {
            path: props.path,
            name: props.name,
            parsedInfo: undefined,
            parsedFolders: [],
        }

    }
}

/* -------------------------------------------------------------------------------------------------
 * LocalFileWithMedia
 * -----------------------------------------------------------------------------------------------*/

export type LocalFileWithMedia = LocalFile & {
    media: AnilistSimpleMedia | undefined
}

/**
 * This method take a [LocalFile] and an array of [AnilistMedia] fetched from AniList.
 * We compare the filenames, anime title, folder title to get the exact media.
 *
 * /!\ IMPORTANT
 * For this to work optimally the user must:
 * 1. Make sure they have the local file's actual anime in their AniList watch list
 * 2. Limit the depth of files to 2 folders
 * -    Example: High Card \ Season 1 \ [Judas] High Card - S01E01.mkv
 * -    Example: High Card \ [Judas] High Card - S01E01.mkv
 * -    Example: [Judas] One Piece Film Z.mkv
 * 3. Make sure if a file DOES NOT have the season, its parent folder has one
 */
export const createLocalFileWithMedia = async (file: LocalFile, allUserMedia: AnilistMedia[] | undefined, relatedMedia: AnilistMedia[]): Promise<LocalFileWithMedia | undefined> => {

    if (allUserMedia) {

        const allMedia = [...allUserMedia, ...relatedMedia].filter(media => media.status === "RELEASING" || media.status === "FINISHED")

        let correspondingMedia: AnilistMedia | undefined = undefined

        if (!!file.parsedInfo && (!!file.parsedInfo?.title || file.parsedFolders.some(n => !!n.title))) { // Compare using parsed file title

            const { correspondingMedia: _c } = await findBestCorrespondingMedia(
                allMedia,
                file.parsedInfo,
                file.parsedFolders,
            )
            correspondingMedia = _c

        }

        // if (!!file.parsedFolders[file.parsedFolders.length - 1] && !correspondingMedia) { // Compare using parsed folder title
        //
        //     const { correspondingMedia: _c } = await findBestCorrespondingMedia(
        //         allMedia,
        //         file.parsedFolders[file.parsedFolders.length - 1],
        //         [],
        //     )
        //     correspondingMedia = _c
        //
        // }

        return {
            ...file,
            media: correspondingMedia,
        }
    }
    return undefined
}

/**
 * This method employs 3 comparison algorithms: Dice's coefficient (string-similarity), Levenshtein's algorithm, and MAL's elastic search algorithm
 * - Get the media titles from 3 possibles values (userPreferred, english, and romaji)
 * - Parse the title that will be used for comparison
 * -    This sequence: Root folder title -> Parent folder title -> File title
 * - Parse a season
 * -    This sequence: Parent folder season -> File season
 * -        example: `Vinland Saga \ Season 2 \ Vinland Saga S02E01.mkv`    -> 2
 * -        example: `Vinland Saga \ Vinland Saga S02E01.mkv`               -> 2
 * - Find variations of the title containing the seasons for comparison
 * -    example: `Vinland Saga \ Season 2 \ Episode 1.mkv`                  -> ["Vinland Saga Season 2", ...]
 * -    example: `Vinland Saga \ S02E01.mkv`                                -> ["Vinland Saga Season 2", ...]
 * -    example: `Vinland Saga \ S01E01.mkv`                                -> ["Vinland Saga", ...]
 * - Find similar title from Dice's coefficient
 * - Find similar title from Levenshtein's algorithm
 * - Find similar title from MAL's elastic search
 * - From these 3 best matches, eliminate the least similar one using Dice's coefficient
 * - From these 2 best matches, find the most similar to the title variations using Dice's coefficient
 * - Compare the best match titles (===) to a media
 *
 * /!\ IMPORTANT
 * - This will ALWAYS return a corresponding media even if it is an incorrect one UNLESS see below \/
 * - This will NOT return a media if neither the folders nor the file have a season (SubsPlease categorization)
 * @param allMedia
 * @param parsed
 * @param foldersParsed
 */
async function findBestCorrespondingMedia(allMedia: AnilistMedia[], parsed: AnimeFileInfo, foldersParsed: AnimeFileInfo[]) {


    function debug(...value: any[]) {
        // if (parsed.original.toLowerCase().includes("e01")) console.log(...value)
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
    const titlesWithSeason = (
        (seasonAsNumber && seasonAsNumber !== 1)
        || (folderSeasonAsNumber && folderSeasonAsNumber !== 1)
    ) ? [
        `${_title} Season ${seasonAsNumber || folderSeasonAsNumber}`,
        `${_title} Part ${seasonAsNumber || folderSeasonAsNumber}`,
        `${_title} Cour ${seasonAsNumber || folderSeasonAsNumber}`,
        `${_title} Part ${romanize(seasonAsNumber || folderSeasonAsNumber!)}`,
        `${_title} S${seasonAsNumber || folderSeasonAsNumber}`,
        `${_title} ${ordinalize(parsed.season || folderParsed?.season!)} Season`,
    ].filter(Boolean) : undefined
    const titlesWithSeasonOne = (
        (seasonAsNumber && seasonAsNumber === 1)
        || (folderSeasonAsNumber && folderSeasonAsNumber === 1)
    ) ? [
        _title,
        `${_title} Season ${seasonAsNumber || folderSeasonAsNumber}`,
        `${_title} Part ${seasonAsNumber || folderSeasonAsNumber}`,
        `${_title} Cour ${seasonAsNumber || folderSeasonAsNumber}`,
        `${_title} Part ${romanize(seasonAsNumber || folderSeasonAsNumber!)}`,
        `${_title} S${seasonAsNumber || folderSeasonAsNumber}`,
        `${_title} ${ordinalize(parsed.season || folderParsed?.season!)} Season`,
    ].filter(Boolean) : undefined
    // If we did not manage to parse a season either in the parent folder or the file title, just use the original title
    let titleVariations = titlesWithSeason || titlesWithSeasonOne || [_title]

    // Handle movie
    titleVariations = titleVariations.map(value => value.toLowerCase())

    /**
     * Using string-similarity
     */

    let similarTitleMatching = titleVariations.filter(Boolean).map((tValue) => {
        const engResult = similarity.findBestMatch(tValue, mediaEngTitles.map(value => value.toLowerCase()))
        const romResult = similarity.findBestMatch(tValue, mediaRomTitles.map(value => value.toLowerCase()))
        const preferredResult = similarity.findBestMatch(tValue, mediaPreferredTitles.map(value => value.toLowerCase()))
        const bestResult = [engResult, romResult, preferredResult].reduce((prev, curr) => {
            return prev.bestMatch.rating >= curr.bestMatch.rating ? prev : curr // Higher rating
        })
        return { titleVale: tValue, bestResult }
    })
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

    const url = new URL("https://myanimelist.net/search/prefix.json")
    url.searchParams.set("type", "anime")
    url.searchParams.set("keyword", _title)
    try {
        const res = await fetch(url, { method: "GET" })
        const body: any = await res.json()
        const anime = body?.categories?.find((category: any) => category?.type === "anime")?.items?.[0]
        const corresponding = allMedia.find(media => media.idMal === anime.id)
        if (anime && !!corresponding) {
            correspondingMediaFromMAL = corresponding
        }
    } catch {

    }

    let differentFoundMedia = [correspondingMediaFromMAL, correspondingMediaUsingSimilarity, correspondingMediaFromDistance].filter(Boolean)

    debug("-----------------------------------------------------")

    const best_userPreferred = eliminateLeastSimilarElement(differentFoundMedia.map(n => n.title?.userPreferred?.toLowerCase()).filter(Boolean))
    const best_english = eliminateLeastSimilarElement(differentFoundMedia.map(n => n.title?.english?.toLowerCase()).filter(Boolean))
    const best_romaji = eliminateLeastSimilarElement(differentFoundMedia.map(n => n.title?.romaji?.toLowerCase()).filter(Boolean))

    debug(differentFoundMedia.map(n => n.title?.userPreferred?.toLowerCase()).filter(Boolean))
    debug(differentFoundMedia.map(n => n.title?.english?.toLowerCase()).filter(Boolean))
    debug(differentFoundMedia.map(n => n.title?.romaji?.toLowerCase()).filter(Boolean))

    debug("---------------")

    debug(best_userPreferred)
    debug(best_english)
    debug(best_romaji)

    const best = titleVariations.map(title => {
        const matchingUserPreferred = similarity.findBestMatch(title.toLowerCase(), best_userPreferred)
        const matchingEnglish = similarity.findBestMatch(title.toLowerCase(), best_english)
        const matchingRomaji = similarity.findBestMatch(title.toLowerCase(), best_romaji)

        return [matchingUserPreferred, matchingEnglish, matchingRomaji].reduce((prev, val) => {
            return val.bestMatch.rating >= prev.bestMatch.rating ? val : prev
        })
    }).reduce((prev, val) => {
        return val.bestMatch.rating >= prev.bestMatch.rating ? val : prev
    })

    let rating: number = 0

    const bestMedia = allMedia.find(media => {
        // Sometimes torrents are released by episode number and not grouped by season
        // So remove preceding seasons
        if (!seasonAsNumber && media.episodes && episodeAsNumber) {
            if (episodeAsNumber >= media.episodes) return false
        }
        if (media.title?.userPreferred?.toLowerCase() === best.bestMatch.target.toLowerCase()
            || media.title?.english?.toLowerCase() === best.bestMatch.target.toLowerCase()
            || media.title?.romaji?.toLowerCase() === best.bestMatch.target.toLowerCase()) {
            // console.log(titleVariations, media.title?.romaji?.toLowerCase(), best.bestMatch.rating)
            rating = best.bestMatch.rating
            return true
        } else {
            return false
        }
    })

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
        const min = distances.reduce((prev, curr) => prev < curr ? prev : curr)
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
