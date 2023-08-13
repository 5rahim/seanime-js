"use server"
// @ts-ignore
import rakun from "@lowlighter/rakun"
import { Settings } from "@/atoms/settings"
import { AnilistMedia } from "@/lib/anilist/fragment"

export type AnimeFileInfo = {
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
    parsedFolder: AnimeFileInfo | undefined
    parsedInfo: AnimeFileInfo | undefined // Parsed anime info
}

/**
 * [LocalFile] represents a file on the host machine.
 * - Use [path] to identity the file
 */

export const createLocalFile = async (settings: Settings, props: Pick<LocalFile, "name" | "path">): Promise<LocalFile> => {

    try {
        const folderPath = props.path.replace(props.name, "").replace(settings.library.localDirectory || "", "").replaceAll("\\", "")
        const parsed = rakun.parse(props.name)
        const parsedFolder = rakun.parse(folderPath)

        return {
            path: props.path,
            name: props.name,
            parsedInfo: {
                title: parsed.name,
                releaseGroup: parsed.subber,
                season: parsed.season,
                part: parsed.part,
                episode: parsed.episode,
            },
            parsedFolder: {
                title: parsedFolder.name,
                releaseGroup: parsedFolder.subber,
                season: parsedFolder.season,
                part: parsedFolder.part,
                episode: parsedFolder.episode,
            },
        }
    } catch (e) {
        console.error("[LocalFile] Parsing error")

        return {
            path: props.path,
            name: props.name,
            parsedInfo: undefined,
            parsedFolder: undefined,
        }

    }
}

/* -------------------------------------------------------------------------------------------------
 * LocalFileWithMedia
 * -----------------------------------------------------------------------------------------------*/

export type LocalFileWithMedia = LocalFile & {
    media: AnilistMedia
}

/**
 * This method take a [LocalFile] and an array of [AnilistMedia] fetched from AniList.
 * We compare the filenames, anime title, folder title to get the exact entry from
 */
export const createLocalFileWithMedia = async (file: LocalFile, allMedia: AnilistMedia[] | undefined): Promise<LocalFileWithMedia | undefined> => {
    if (allMedia) {
        const correspondingMedia = allMedia.find(media => {
            // TODO Use string-similarity to compare title -> synonyms -> folder's title
            // if(media.)
            return false
        })

        if (correspondingMedia) {
            return {
                ...file,
                media: correspondingMedia,
            }
        }
    }
    return undefined
}
