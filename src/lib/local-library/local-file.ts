"use server"
// @ts-ignore
import rakun from "@lowlighter/rakun"
import { Settings } from "@/atoms/settings"
import { AnilistMedia, AnilistSimpleMedia } from "@/lib/anilist/fragment"
import similarity from "string-similarity"
import _ from "lodash"
// import dynamic from "next/dynamic"
// import anitomyscript from "anitomyscript"
// const anitomyscript = dynamic(() => import("anitomyscript"), { ssr: false })

export type AnimeFileInfo = {
    text: string
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
 */

export const createLocalFile = async (settings: Settings, props: Pick<LocalFile, "name" | "path">): Promise<LocalFile> => {

    try {
        const folderPath = props.path.replace(props.name, "").replace(settings.library.localDirectory || "", "")
        const parsed = rakun.parse(props.name)

        const folders = folderPath.split("\\").filter(value => !!value && value.length > 0)
        const parsedFolders = folders.map(folder => {
            const obj = rakun.parse(folder)
            // Keep the folder which has a parsed title
            if (obj.name) {
                return ({
                    text: folder,
                    title: obj.name,
                    releaseGroup: obj.subber,
                    season: obj.season,
                    part: obj.part,
                    episode: obj.episode,
                })
            }
        }).filter(a => !!a) as AnimeFileInfo[]
        // console.log(folders)


        return {
            path: props.path,
            name: props.name,
            parsedInfo: {
                text: parsed.filename,
                title: parsed.name,
                releaseGroup: parsed.subber,
                season: parsed.season,
                part: parsed.part,
                episode: parsed.episode,
            },
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
    media: AnilistSimpleMedia
}

/**
 * This method take a [LocalFile] and an array of [AnilistMedia] fetched from AniList.
 * We compare the filenames, anime title, folder title to get the exact entry from
 */
export const createLocalFileWithMedia = async (file: LocalFile, allMedia: AnilistMedia[] | undefined, relatedMedia: AnilistMedia[]): Promise<LocalFileWithMedia | undefined> => {

    if (allMedia) {

        let correspondingMediaFromFile: AnilistMedia | undefined = undefined
        let correspondingMediaFromFileRating: number = 0
        let correspondingMediaFromFolder: AnilistMedia | undefined = undefined
        let correspondingMediaFromFolderRating: number = 0

        if (!!file.parsedInfo?.title) { // Compare using parsed file title

            const { correspondingMedia, rating } = await findBestCorrespondingMedia(
                [...allMedia, ...relatedMedia],
                file.parsedInfo,
                file.parsedFolders,
            )

            correspondingMediaFromFile = correspondingMedia
            correspondingMediaFromFileRating = rating

        }

        if (!!file.parsedFolders[file.parsedFolders.length - 1]) { // Compare using parsed folder title

            const { correspondingMedia, rating } = await findBestCorrespondingMedia(
                [...allMedia, ...relatedMedia],
                file.parsedFolders[file.parsedFolders.length - 1],
                [],
            )

            correspondingMediaFromFolder = correspondingMedia
            correspondingMediaFromFolderRating = rating

        }

        if (correspondingMediaFromFile && correspondingMediaFromFolder) {
            return {
                ...file,
                media: (correspondingMediaFromFileRating > correspondingMediaFromFolderRating)
                    ? correspondingMediaFromFile
                    : correspondingMediaFromFolder,
            }
        } else if (correspondingMediaFromFile) {
            return {
                ...file,
                media: correspondingMediaFromFile,
            }
        } else if (correspondingMediaFromFolder) {
            return {
                ...file,
                media: correspondingMediaFromFolder,
            }
        }
    }
    return undefined
}

async function findBestCorrespondingMedia(allMedia: AnilistMedia[], parsed: AnimeFileInfo, foldersParsed: AnimeFileInfo[]) {

    function debug(...value: any[]) {
        if (parsed.title.toLowerCase().includes("film z")) console.log(value)
    }

    let folderParsed: AnimeFileInfo | undefined

    if (foldersParsed.length > 0) {
        folderParsed = foldersParsed[foldersParsed.length - 1]
    }


    const episodeAsNumber = (parsed.episode && _.isNumber(parseInt(parsed.episode)))
        ? parseInt(parsed.episode)
        : undefined
    const folderSeasonAsNumber = (folderParsed?.season && _.isNumber(parseInt(folderParsed.season)))
        ? parseInt(folderParsed.season)
        : undefined
    const seasonAsNumber = (parsed.season && _.isNumber(parseInt(parsed.season)))
        ? parseInt(parsed.season)
        : undefined

    // Use this title if we did not manage to parse a season from the folder or the file
    const titleWithoutSeason = (folderSeasonAsNumber && (!seasonAsNumber || seasonAsNumber === 1)) ? parsed.title : undefined
    const titlesWithSeason = (seasonAsNumber || folderSeasonAsNumber) ? [
        `${parsed.title} Season ${seasonAsNumber || folderSeasonAsNumber}`,
        `${parsed.title} S${seasonAsNumber || folderSeasonAsNumber}`,
    ] : undefined
    // Use this title if we could not extract anything from above ^
    const exceptionTitle = (!titlesWithSeason && !titlesWithSeason) ? parsed.title : undefined

    // debug(folderSeasonAsNumber, seasonAsNumber, parsed.title)
    // debug(titleWithoutSeason, titlesWithSeason, exceptionTitle)

    const mediaEngTitles = allMedia.map(media => media.title?.english).filter(value => value?.length && value.length > 0) as string[]
    const mediaRomTitles = allMedia.map(media => media.title?.romaji).filter(value => value?.length && value.length > 0) as string[]

    let titleMatching = [titleWithoutSeason, ...(titlesWithSeason || []), exceptionTitle].filter(value => !!value).map((tValue) => {
        const engResult = similarity.findBestMatch(tValue!.toLowerCase(), mediaEngTitles.map(value => value.toLowerCase()))
        const romResult = similarity.findBestMatch(tValue!.toLowerCase(), mediaRomTitles.map(value => value.toLowerCase()))
        const bestResult = (engResult.bestMatch.rating > romResult.bestMatch.rating) ? engResult : romResult
        const bestResultLng = (engResult.bestMatch.rating > romResult.bestMatch.rating) ? "english" : "romaji"
        debug(tValue, bestResult.bestMatch.target, bestResult.bestMatch.rating)
        return { titleVale: tValue!, bestResult, bestResultLng }
    })

    titleMatching = _.sortBy(titleMatching, n => n.bestResult.bestMatch.rating).reverse()

    // If there is a folder, and it includes a season, ignore
    if (folderParsed && folderSeasonAsNumber) {
        titleMatching = []
    }

    const bestResult = titleMatching?.[0]?.bestResult
    const bestResultLng = titleMatching?.[0]?.bestResultLng


    let correspondingMedia = (bestResult && bestResultLng) ? allMedia
        .filter(media => {
            // Sometimes torrents are released by episode number and not grouped by season
            // So remove preceding seasons
            if (!seasonAsNumber && media.episodes && episodeAsNumber) {
                return episodeAsNumber <= media.episodes
            }
            return true
        })
        .find(media => {
            if (bestResultLng === "english") {
                return media.title?.english === mediaEngTitles[bestResult.bestMatchIndex]
            } else {
                return media.title?.romaji === mediaRomTitles[bestResult.bestMatchIndex]
            }
        }) : undefined
    const rating = bestResult?.bestMatch?.rating

    /* Test with MAL */

    const url = new URL("https://myanimelist.net/search/prefix.json")
    url.searchParams.set("type", "anime")
    url.searchParams.set("keyword", parsed.title)
    const res = await fetch(url, { method: "GET" })
    const body: any = await res.json()
    const anime = body?.categories?.find((category: any) => category?.type === "anime")?.items?.[0]
    if (anime && !!allMedia.find(media => media.id === anime.id)) {
        correspondingMedia = allMedia.find(media => media.id === anime.id)
    }

    delete correspondingMedia?.relations

    return {
        correspondingMedia,
        rating,
    }
}


// function findBestCorrespondingMedia(allMedia: AnilistMedia[], parsed: AnimeFileInfo, folderParsed: AnimeFileInfo | undefined) {
//
//     function debug(...value: any[]) {
//         if (parsed.title.toLowerCase().includes("durarara")) console.log(value)
//     }
//
//     const episodeAsNumber = (parsed.episode && _.isNumber(parseInt(parsed.episode)))
//         ? parseInt(parsed.episode)
//         : undefined
//     const folderSeasonAsNumber = (folderParsed?.season && _.isNumber(parseInt(folderParsed.season)))
//         ? parseInt(folderParsed.season)
//         : undefined
//     const seasonAsNumber = (parsed.season && _.isNumber(parseInt(parsed.season)))
//         ? parseInt(parsed.season)
//         : undefined
//
//     // Use this title if we did not manage to parse a season from the folder or the file
//     const titleWithoutSeason = (folderSeasonAsNumber && (!seasonAsNumber || seasonAsNumber === 1)) ? parsed.title : undefined
//     const titlesWithSeason = (seasonAsNumber || folderSeasonAsNumber) ? [
//         `${parsed.title} Season ${seasonAsNumber || folderSeasonAsNumber}`,
//         `${parsed.title} S${seasonAsNumber || folderSeasonAsNumber}`,
//     ] : undefined
//     // Use this title if we could not extract anything from above ^
//     const exceptionTitle = (!titlesWithSeason && !titlesWithSeason) ? parsed.title : undefined
//
//     debug(folderSeasonAsNumber, seasonAsNumber, parsed.title)
//     debug(titleWithoutSeason, titlesWithSeason)
//
//     const mediaEngTitles = allMedia.map(media => media.title?.english).filter(value => value?.length && value.length > 0) as string[]
//     const mediaRomTitles = allMedia.map(media => media.title?.romaji).filter(value => value?.length && value.length > 0) as string[]
//
//     let titleMatching = [titleWithoutSeason, ...(titlesWithSeason || []), exceptionTitle].filter(value => !!value).map((tValue) => {
//         const engResult = similarity.findBestMatch(tValue!.toLowerCase(), mediaEngTitles.map(value => value.toLowerCase()))
//         const romResult = similarity.findBestMatch(tValue!.toLowerCase(), mediaRomTitles.map(value => value.toLowerCase()))
//         const bestResult = (engResult.bestMatch.rating > romResult.bestMatch.rating) ? engResult : romResult
//         const bestResultLng = (engResult.bestMatch.rating > romResult.bestMatch.rating) ? "english" : "romaji"
//         debug(tValue, bestResult.bestMatch)
//         return { titleVale: tValue!, bestResult, bestResultLng }
//     })
//
//     titleMatching = _.sortBy(titleMatching, n => n.bestResult.bestMatch.rating).reverse()
//
//     // If there is a folder, and it includes a season, ignore
//     if (folderParsed && folderSeasonAsNumber) {
//         titleMatching = []
//     }
//
//     const bestResult = titleMatching?.[0]?.bestResult
//     const bestResultLng = titleMatching?.[0]?.bestResultLng
//
//
//     const correspondingMedia = (bestResult && bestResultLng) ? allMedia
//         .filter(media => {
//             // Sometimes torrents are released by episode number and not grouped by season
//             // So remove preceding seasons
//             if (!seasonAsNumber && media.episodes && episodeAsNumber) {
//                 return episodeAsNumber <= media.episodes
//             }
//             return true
//         })
//         .find(media => {
//             if (bestResultLng === "english") {
//                 return media.title?.english === mediaEngTitles[bestResult.bestMatchIndex]
//             } else {
//                 return media.title?.romaji === mediaRomTitles[bestResult.bestMatchIndex]
//             }
//         }) : undefined
//     const rating = bestResult?.bestMatch?.rating
//
//     return {
//         correspondingMedia,
//         rating,
//     }
// }
