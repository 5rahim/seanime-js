/* -------------------------------------------------------------------------------------------------
 * Repository actions
 * -----------------------------------------------------------------------------------------------*/
"use server"
import { Settings } from "@/atoms/settings"
import path from "path"
import fs from "fs/promises"
import { Dirent, existsSync } from "fs"
import { createLocalFile, createLocalFileWithMedia } from "@/lib/local-library/local-file"
import { AnilistShortMedia, AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { Nullish } from "@/types/common"
import { AnimeCollectionQuery } from "@/gql/graphql"
import { logger } from "@/lib/helpers/debug"
import { ScanLogging } from "@/lib/local-library/logs"
import { valueContainsSeason } from "@/lib/local-library/utils"
import { anilist_shortMediaToShowcaseMedia } from "@/lib/anilist/utils"
import { LocalFile, LocalFileWithMedia } from "@/lib/local-library/types"
import rakun from "@/lib/rakun"
import orderBy from "lodash/orderBy"

/**
 * @internal Used on the server
 * @description Purpose
 * - Get all the local files from the local directory using {retrieveLocalFiles}
 * - Match them with their associated [AnilistShowcaseMedia] using {createLocalFileWithMedia}
 * - Return the hydrated [LocalFileWithMedia]s
 * @description Use
 * - Process the returned [LocalFileWithMedia]s
 * - In the current implementation, the returned [LocalFileWithMedia]s are then processed using {inspectProspectiveLibraryEntry}
 */
export async function retrieveLocalFilesWithMedia(props: {
    settings: Settings
    userName: Nullish<string>
    data: AnimeCollectionQuery
    markedPaths: {
        ignored: string[]
        locked: string[]
    }
    _scanLogging: ScanLogging
}) {

    const {
        settings,
        userName,
        data,
        markedPaths,
        _scanLogging,
    } = props

    const currentPath = settings.library.localDirectory

    if (currentPath && userName) {


        // Populate [localFiles] with all files recursively
        const localFiles: LocalFile[] = []
        await _retrieveLocalFiles({
            settings,
            directoryPath: currentPath,
            files: localFiles,
            markedPaths,
            _scanLogging,
        })

        // If there are files, hydrate them with their associated [AnilistShowcaseMedia]
        if (localFiles.length > 0) {
            let allUserMedia = data.MediaListCollection?.lists?.map(n => n?.entries).flat().filter(Boolean).map(entry => entry.media) ?? [] satisfies AnilistShortMedia[]
            allUserMedia = allUserMedia.map(media => anilist_shortMediaToShowcaseMedia(media)) satisfies AnilistShowcaseMedia[]
            _scanLogging.add("repository/scanLocalFiles", ">>> [repository/retrieveHydratedLocalFiles]")
            _scanLogging.add("repository/scanLocalFiles", "Getting related media from user watch list")

            // Get sequels, prequels... from each media as [AnilistShowcaseMedia]
            const relatedMedia = allUserMedia.filter(Boolean)
                .flatMap(media => media.relations?.edges?.filter(edge => (edge?.relationType === "PREQUEL"
                        || edge?.relationType === "SEQUEL"
                        || edge?.relationType === "SPIN_OFF"
                        || edge?.relationType === "SIDE_STORY"
                        || edge?.relationType === "ALTERNATIVE"
                        || edge?.relationType === "PARENT"),
                    )
                        .flatMap(edge => edge?.node).filter(Boolean),
                ) as AnilistShowcaseMedia[]


            const allMedia = [...allUserMedia, ...relatedMedia].filter(Boolean).filter(media => media?.status === "RELEASING" || media?.status === "FINISHED")
            const mediaEngTitles = allMedia.map(media => media.title?.english).filter(Boolean)
            const mediaRomTitles = allMedia.map(media => media.title?.romaji).filter(Boolean)
            const mediaPreferredTitles = allMedia.map(media => media.title?.userPreferred).filter(Boolean)
            const mediaSynonymsWithSeason = allMedia.flatMap(media => media.synonyms?.filter(valueContainsSeason)).filter(Boolean)

            _scanLogging.add("repository/scanLocalFiles", "Hydrating local files")
            let localFilesWithMedia: LocalFileWithMedia[] = []

            // Cache previous matches, key: title variations
            const _matchingCache = new Map<string, AnilistShowcaseMedia | undefined>()

            for (let i = 0; i < localFiles.length; i++) {
                const created = await createLocalFileWithMedia({
                    file: localFiles[i],
                    allMedia,
                    mediaTitles: {
                        eng: mediaEngTitles,
                        rom: mediaRomTitles,
                        preferred: mediaPreferredTitles,
                        synonymsWithSeason: mediaSynonymsWithSeason,
                    },
                    _matchingCache,
                    _scanLogging,
                })
                if (created) {
                    localFilesWithMedia.push(created)
                }
            }
            _matchingCache.clear()
            _scanLogging.add("repository/scanLocalFiles", "Finished hydrating files")
            _scanLogging.add("repository/scanLocalFiles", "<<< [repository/retrieveHydratedLocalFiles]")

            return localFilesWithMedia
        }

    }
    return undefined
}

/**
 * @internal Used on the server
 * @description Purpose
 * - Recursively get the files as [LocalFile] from the local directory
 * - Populates `files`
 * - Ignores `markedPaths`
 */
export async function _retrieveLocalFiles(props: {
    settings: Settings
    directoryPath: string
    files: LocalFile[]
    markedPaths: {
        ignored: string[]
        locked: string[]
    }
    _scanLogging: ScanLogging
    allowedTypes?: string[]
}): Promise<void> {

    const {
        settings,
        directoryPath,
        files,
        markedPaths,
        _scanLogging,
        allowedTypes = ["mkv", "mp4"],
    } = props

    try {
        const items: Dirent[] = await fs.readdir(directoryPath, { withFileTypes: true })

        logger("repository/retrieveLocalFiles").info("Getting all files recursively")
        for (const item of items) {
            const itemPath = path.join(directoryPath, item.name)
            const stats = await fs.stat(itemPath)

            if (
                stats.isFile()
                && allowedTypes.some(type => itemPath.endsWith(`.${type}`))
                && ![...markedPaths.ignored, ...markedPaths.locked].includes(itemPath)
            ) {
                _scanLogging.add(itemPath, ">>> [repository/retrieveLocalFiles]")
                _scanLogging.add(itemPath, "File retrieved")
                files.push(await createLocalFile(settings, {
                    name: item.name,
                    path: itemPath,
                }, _scanLogging))
            } else if (stats.isDirectory()) {

                const dirents = await fs.readdir(itemPath, { withFileTypes: true })
                const fileNames = dirents.filter(dirent => dirent.isFile()).map(dirent => dirent.name)
                if (!fileNames.find(name => name === ".unsea" || name === ".seaignore")) {
                    await _retrieveLocalFiles({
                        settings,
                        directoryPath: itemPath,
                        files,
                        markedPaths,
                        _scanLogging,
                    })
                }

            }
        }
    } catch (e) {
        logger("repository/retrieveLocalFiles").error("Failed")
    }
}

/**
 * @description Purpose
 * - Get the paths that need to be cleaned from [sea-local-files]
 */
export async function checkLocalFiles(settings: Settings, { ignored, locked }: {
    ignored: string[],
    locked: string[]
}) {
    const directoryPath = settings.library.localDirectory
    let pathsToClean: string[] = []

    if (!directoryPath || !existsSync(directoryPath)) {
        return { pathsToClean }
    }

    const checkPaths = async (paths: string[]) => {
        for (const path of paths) {
            try {
                await fs.access(path)
            } catch (e) {
                pathsToClean.push(path)
            }
        }
    }

    await Promise.all([
        checkPaths(ignored),
        checkPaths(locked),
    ])

    return { pathsToClean }
}

/**
 * @description Purpose
 * - Get all the media titles from the local directory (shallow)
 */
export async function getMediaTitlesFromLocalDirectory(props: {
    directoryPath: string,
    type?: "shallow" | "deep" // TODO Get titles from subdirectories
}) {

    const { directoryPath, type = "shallow" } = props

    try {
        let fileNames = new Set<string>()
        let titles = new Set<string>()
        let items: { title: string, parsed: ParsedTorrentInfo }[] = []
        const dirents: Dirent[] = await fs.readdir(directoryPath, { withFileTypes: true })

        logger("repository/getMediaTitlesFromLocalDirectory").info("Getting all file fileNames")
        for (const item of dirents) {
            if (item.name.match(/^(.*\.mkv|.*\.mp4|[^.]+)$/)) {
                fileNames.add(item.name.replace(/(.mkv|.mp4)/, ""))
            }
        }
        for (const name of fileNames) {
            const parsed = rakun.parse(name)
            if (parsed?.name) {
                titles.add(parsed?.name)
                items.push({ title: parsed.name, parsed })
            }
        }
        return {
            fileNames: [...fileNames],
            titles: orderBy([...titles], [n => n, n => n.length], ["asc", "asc"]),
            items: orderBy([...items], [n => n.title, n => n.title.length], ["asc", "asc"]),
        }
    } catch (e) {
        logger("repository/getMediaTitlesFromLocalDirectory").error("Failed")
        return undefined
    }
}
