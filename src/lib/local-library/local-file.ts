"use server"
import rakun from "@/lib/rakun/rakun"
import { Settings } from "@/atoms/settings"
import { AnilistMedia, AnilistSimpleMedia } from "@/lib/anilist/fragment"
import { findBestCorrespondingMedia } from "@/lib/local-library/media-matching"

export type AnimeFileInfo = {
    original: string
    title?: string
    releaseGroup?: string
    season?: string
    part?: string
    episode?: string
}

export type LocalFile = {
    name: string // File name
    path: string // File path
    parsedFolderInfo: AnimeFileInfo[]
    parsedInfo: AnimeFileInfo | undefined // Parsed anime info
    locked: boolean
    ignored: boolean
    mediaId: number | null
}

/**
 * [LocalFile] represents a file on the host machine.
 * - Use [path] to identity the file
 *
 * - parsedInfo: Parsed info from the file name
 *      - Is undefined if we can't parse a title from the file name or folders
 *      - It is undefined if we can't parse an episode
 * - parsedFolderInfo: Parsed info from each parent folder
 *      - Is undefined if we can't parse a title or a season
 */
export const createLocalFile = async (settings: Settings, props: Pick<LocalFile, "name" | "path">): Promise<LocalFile> => {

    try {
        const folderPath = props.path.replace(props.name, "").replace(settings.library.localDirectory || "", "")
        const parsed = rakun.parse(props.name)

        const folders = folderPath.split("\\").filter(value => !!value && value.length > 0)
        const parsedFolderInfo = folders.map(folder => {
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

        const branchHasTitle = !!parsed.name || parsedFolderInfo.some(obj => !!obj.title)
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
            parsedFolderInfo,
            locked: false,
            ignored: false,
            mediaId: null,
        }
    } catch (e) {
        console.error("[LocalFile] Parsing error", e)

        return {
            path: props.path,
            name: props.name,
            parsedInfo: undefined,
            parsedFolderInfo: [],
            locked: false,
            ignored: false,
            mediaId: null,
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

        // Find the corresponding media only if:
        // The file has been parsed AND it has an anime title OR one of its folders have an anime title
        if (!!file.parsedInfo && (!!file.parsedInfo?.title || file.parsedFolderInfo.some(n => !!n.title))) {

            const { correspondingMedia: _c } = await findBestCorrespondingMedia(
                allMedia,
                file.parsedInfo,
                file.parsedFolderInfo,
            )
            correspondingMedia = _c

        }

        return {
            ...file,
            media: correspondingMedia,
            // mediaId: correspondingMedia?.id || null
        }
    }
    return undefined
}
