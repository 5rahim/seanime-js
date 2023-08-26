"use server"
import rakun from "@/lib/rakun/rakun"
import { Settings } from "@/atoms/settings"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { findBestCorrespondingMedia } from "@/lib/local-library/media-matching"
import { ScanLogging } from "@/lib/local-library/logs"

export type AnimeFileInfo = {
    original: string
    title?: string
    releaseGroup?: string
    season?: string
    part?: string
    cour?: string
    episode?: string
}

export type LocalFile = {
    name: string // File name
    path: string // File path
    parsedFolderInfo: AnimeFileInfo[]
    parsedInfo: AnimeFileInfo | undefined // Parsed anime info
    metadata: {
        episode?: number
        isVersion?: boolean
        isOVA?: boolean
        isNC?: boolean
    }
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
export const createLocalFile = async (settings: Settings, props: Pick<LocalFile, "name" | "path">, _scanLogging: ScanLogging): Promise<LocalFile> => {

    _scanLogging.add(props.path, ">>> [local-file]")

    try {
        const folderPath = props.path.replace(props.name, "").replace(settings.library.localDirectory || "", "")
        const parsed = rakun.parse(props.name)
        const parsedInfo = {
            original: parsed.filename,
            title: parsed.name,
            releaseGroup: parsed.subber,
            season: parsed.season,
            part: parsed.part,
            cour: parsed.cour,
            episode: parsed.episode,
        }
        _scanLogging.add(props.path, `  -> Parsed from file name ` + JSON.stringify(parsedInfo))

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
                    cour: obj.cour,
                    episode: obj.episode,
                })
            }
        }).filter(Boolean)
        _scanLogging.add(props.path, `  -> Parsed from parent folders ` + JSON.stringify(parsedFolderInfo))

        const branchHasTitle = !!parsed.name || parsedFolderInfo.some(obj => !!obj.title)
        _scanLogging.add(props.path, `  -> Branch has title? ` + branchHasTitle)


        return {
            path: props.path,
            name: props.name,
            parsedInfo: (branchHasTitle) ? parsedInfo : undefined,
            parsedFolderInfo,
            metadata: {},
            locked: false, // Default values, will be hydrated later
            ignored: false, // Default values, will be hydrated later
            mediaId: null, // Default values, will be hydrated later
        }
    } catch (e) {
        _scanLogging.add(props.path, `  -> error - Parsing error`)

        console.error("[LocalFile] Parsing error", e)

        return {
            path: props.path,
            name: props.name,
            parsedInfo: undefined,
            parsedFolderInfo: [],
            metadata: {},
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
    media: AnilistShowcaseMedia | undefined
}

/**
 * This method take a [LocalFile] and an array of [AnilistShortMedia] fetched from AniList.
 * We compare the filenames, anime title, folder title to get the exact media.
 */
export const createLocalFileWithMedia = async (
    file: LocalFile,
    allMedia: AnilistShowcaseMedia[],
    mediaTitles: { eng: string[], rom: string[], preferred: string[], synonymsWithSeason: string[] },
    _matchingCache: Map<string, AnilistShowcaseMedia | undefined>,
    _scanLogging: ScanLogging,
): Promise<LocalFileWithMedia | undefined> => {

    if (allMedia.length > 0) {

        let correspondingMedia: AnilistShowcaseMedia | undefined = undefined

        // Find the corresponding media only if:
        // The file has been parsed AND it has an anime title OR one of its folders has an anime title
        if (!!file.parsedInfo && (!!file.parsedInfo?.title || file.parsedFolderInfo.some(n => !!n.title))) {

            const { correspondingMedia: media } = await findBestCorrespondingMedia({
                file,
                allMedia,
                mediaTitles,
                parsed: file.parsedInfo,
                parsedFolderInfo: file.parsedFolderInfo,
                _matchingCache,
                _scanLogging,
            })
            correspondingMedia = media

        } else {
            _scanLogging.add(file.path, "error - Could not parse any info")
        }

        return {
            ...file,
            media: correspondingMedia,
            // mediaId: correspondingMedia?.id || null <- Don't need it, will be hydrated later
        }
    }
    return undefined
}
