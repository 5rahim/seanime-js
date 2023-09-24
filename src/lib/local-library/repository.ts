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
import { shortMediaToShowcaseMedia } from "@/lib/anilist/utils"
import { LocalFile, LocalFileWithMedia } from "@/lib/local-library/types"

/**
 * Recursively get the files from the local directory
 * This method hydrates each retrieved [LocalFile] with its associated [AnilistShowcaseMedia]
 */
export async function retrieveHydratedLocalFiles(
    settings: Settings,
    userName: Nullish<string>,
    data: AnimeCollectionQuery,
    {
        ignored,
        locked,
    }: {
        ignored: string[],
        locked: string[],
    },
    _scanLogging: ScanLogging,
) {
    const currentPath = settings.library.localDirectory

    if (currentPath && userName) {


        const localFiles: LocalFile[] = []
        await getAllFilesRecursively(settings, currentPath, localFiles, { ignored, locked }, _scanLogging) // <-----------------

        if (localFiles.length > 0) {
            let allUserMedia = data.MediaListCollection?.lists?.map(n => n?.entries).flat().filter(Boolean).map(entry => entry.media) ?? [] satisfies AnilistShortMedia[]
            allUserMedia = allUserMedia.map(media => shortMediaToShowcaseMedia(media)) satisfies AnilistShowcaseMedia[]
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
 * Recursively get the files as [LocalFile] type
 * This method modifies the `files` argument
 */
async function getAllFilesRecursively(
    settings: Settings,
    directoryPath: string,
    files: LocalFile[],
    { ignored, locked }: { ignored: string[], locked: string[] },
    _scanLogging: ScanLogging,
    allowedTypes: string[] = ["mkv", "mp4"],
): Promise<void> {
    try {
        const items: Dirent[] = await fs.readdir(directoryPath, { withFileTypes: true })

        logger("repository/getAllFilesRecursively").info("Getting all files recursively")
        for (const item of items) {
            const itemPath = path.join(directoryPath, item.name)
            const stats = await fs.stat(itemPath)

            if (
                stats.isFile()
                && allowedTypes.some(type => itemPath.endsWith(`.${type}`))
                && ![...ignored, ...locked].includes(itemPath)
            ) {
                _scanLogging.add(itemPath, ">>> [repository/getAllFilesRecursively]")
                _scanLogging.add(itemPath, "File retrieved")
                files.push(await createLocalFile(settings, {
                    name: item.name,
                    path: itemPath,
                }, _scanLogging))
            } else if (stats.isDirectory()) {

                const dirents = await fs.readdir(itemPath, { withFileTypes: true })
                const fileNames = dirents.filter(dirent => dirent.isFile()).map(dirent => dirent.name)
                if (!fileNames.find(name => name === ".unsea" || name === ".seaignore")) {
                    await getAllFilesRecursively(settings, itemPath, files, { ignored, locked }, _scanLogging)
                }

            }
        }
    } catch (e) {
        logger("repository/getAllFilesRecursively").error("Failed")
    }
}

/**
 * This function is ran every time the user refresh entries
 * It goes through the ignored and locked paths in the background to make sure they still exist
 * If they don't, it returns the array of paths that need to be cleaned from [sea-local-files]
 */
export async function cleanupFiles(settings: Settings, { ignored, locked }: { ignored: string[], locked: string[] }) {
    try {

        let pathsToClean: string[] = []

        const directoryPath = settings.library.localDirectory

        if (directoryPath && existsSync(directoryPath)) {

            for (const path of ignored) {
                try {
                    const stats = await fs.stat(path)
                } catch (e) {
                    pathsToClean.push(path)
                }
            }
            for (const path of locked) {
                try {
                    const stats = await fs.stat(path)
                } catch (e) {
                    pathsToClean.push(path)
                }
            }
        } else {
            throw new Error("Directory does not exist")
        }

        return {
            pathsToClean,
        }
    } catch (e) {
        logger("repository/cleanupFiles").error("Failed")
        return {
            pathsToClean: [],
        }
    }
}
