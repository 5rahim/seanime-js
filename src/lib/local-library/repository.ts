/* -------------------------------------------------------------------------------------------------
 * Repository actions
 * -----------------------------------------------------------------------------------------------*/
"use server"
import { Settings } from "@/atoms/settings"
import path from "path"
import fs from "fs/promises"
import _fs, { Dirent, existsSync } from "fs"
import {
    createLocalFile,
    createLocalFileWithMedia,
} from "@/lib/local-library/local-file"
import { AnilistShortMedia, AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { Nullish } from "@/types/common"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeCollectionDocument, AnimeCollectionQuery, UpdateEntryDocument } from "@/gql/graphql"
import _ from "lodash"
import { inspectProspectiveLibraryEntry } from "@/lib/local-library/library-entry"
import { logger } from "@/lib/helpers/debug"
import { ScanLogging } from "@/lib/local-library/logs"
import { valueContainsSeason } from "@/lib/local-library/utils"
import { shortMediaToShowcaseMedia } from "@/lib/anilist/utils"
import { LocalFile, LocalFileWithMedia } from "@/lib/local-library/types"

/**
 *  Goes through non-locked and non-ignored [LocalFile]s and returns
 *  - Hydrated [LocalFile]s
 * @param settings
 * @param userName
 * @param token
 * @param ignored
 * @param locked
 */
export async function scanLocalFiles(
    settings: Settings,
    userName: Nullish<string>,
    token: string,
    { ignored, locked }: { ignored: string[], locked: string[] },
) {
    const start = performance.now()
    const _scanLogging = new ScanLogging()
    _scanLogging.add("repository/scanLocalFiles", `Local directory: ${settings.library.localDirectory}`)
    logger("repository/scanLocalFiles").info("Local directory", settings.library.localDirectory)

    // Check if the library exists
    if (!settings.library.localDirectory || !_fs.existsSync(settings.library.localDirectory)) {
        logger("repository/scanLocalFiles").error("Directory does not exist")
        _scanLogging.add("repository/scanLocalFiles", "Directory does not exist")
        await _scanLogging.writeSnapshot()
        _scanLogging.clear()
        return { error: "Couldn't find the local directory." }
    }

    // Get the user watch list data
    _scanLogging.add("repository/scanLocalFiles", "Fetching user media list")
    const data = await useAniListAsyncQuery(AnimeCollectionDocument, { userName })
    const watchListMediaIds = new Set(data.MediaListCollection?.lists?.filter(n => n?.entries).flatMap(n => n?.entries?.map(n => n?.media)).map(n => n?.id).filter(Boolean))

    // Get the hydrated files
    _scanLogging.add("repository/scanLocalFiles", "Retrieving and hydrating local files")
    const files = await retrieveHydratedLocalFiles(settings, userName, data, { ignored, locked }, _scanLogging)

    _scanLogging.add("repository/scanLocalFiles", `Retrieved ${files?.length || 0} files`)

    if (files && files.length > 0) {

        // Constants
        const filesWithNoMedia: LocalFileWithMedia[] = files.filter(n => !n.media) // Unsuccessfully matched
        const localFilesWithMedia = files.filter(n => !!n.media) // Successfully matched files
        const matchedMedia = _.uniqBy(files.map(n => n.media), n => n?.id) // Media with file matches

        /** Values to be returned **/
        let checkedFiles: LocalFile[] = [...filesWithNoMedia.map(f => _.omit(f, "media"))]

        // Keep track of queried media to avoid repeat
        const _queriedMediaCache = new Map<number, AnilistShortMedia>()

        // We group all the hydrated files we got by their media, so we can check them by group (entry)
        const _groupedByMediaId = _.groupBy(localFilesWithMedia, n => n.media!.id)
        _scanLogging.add("repository/scanLocalFiles", "Inspecting prospective library entry")
        for (let i = 0; i < Object.keys(_groupedByMediaId).length; i++) {
            const mediaId = Object.keys(_groupedByMediaId)[i]
            const mediaIdAsNumber = Number(mediaId)

            if (!isNaN(mediaIdAsNumber)) {
                const currentMedia = matchedMedia.find(media => media?.id === mediaIdAsNumber)
                const filesToBeInspected = localFilesWithMedia.filter(f => f.media?.id === mediaIdAsNumber)

                if (currentMedia) {
                    // Inspect the files grouped under same media
                    const { acceptedFiles, rejectedFiles } = await inspectProspectiveLibraryEntry({
                        media: currentMedia,
                        files: filesToBeInspected,
                        _queriedMediaCache,
                        _scanLogging,
                    })

                    checkedFiles = [
                        ...checkedFiles,
                        // Set media id for accepted files
                        ...acceptedFiles.map(f => _.omit(f, "media")).map(file => ({
                            ...file,
                            mediaId: file.mediaId || currentMedia.id,
                        })),
                        ...rejectedFiles.map(f => _.omit(f, "media")),
                    ]
                }

            }
        }

        _queriedMediaCache.clear()

        const unknownButAddedMediaIds = new Set() // Keep track to avoid repeat
        // Go through checked files -> If we find a mediaId that isn't in the user watch list, add that media to PLANNING list
        for (let i = 0; i < checkedFiles.length; i++) {
            const file = checkedFiles[i]
            if (file.mediaId && !unknownButAddedMediaIds.has(file.mediaId) && !watchListMediaIds.has(file.mediaId)) {
                try {
                    const mutation = await useAniListAsyncQuery(UpdateEntryDocument, {
                        mediaId: file.mediaId, // Int
                        status: "PLANNING", // MediaListStatus
                    }, token)
                    _scanLogging.add(file.path, "Added media to PLANNING list")
                } catch (e) {
                    _scanLogging.add(file.path, "error - Could not add media to PLANNING list")
                }
                unknownButAddedMediaIds.add(file.mediaId)
            }
        }

        const end = performance.now()

        _scanLogging.add("repository/scanLocalFiles", "Finished")
        _scanLogging.add("repository/scanLocalFiles", `The scan was completed in ${((end - start) / 1000).toFixed(2)} seconds`)
        logger("repository/scanLocalFiles").success("Library scanned successfully", checkedFiles.length)

        await _scanLogging.writeSnapshot()
        _scanLogging.clear()

        return {
            /**
             * Non-locked and non-ignored scanned files with up-to-date meta (mediaIds)
             */
            checkedFiles,
        }
    }

    logger("repository/scanLocalFiles").success("Library scanned successfully 0")
    await _scanLogging.writeSnapshot()
    _scanLogging.clear()

    return { checkedFiles: [] }
}

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
            allUserMedia = allUserMedia.map(media => shortMediaToShowcaseMedia(media)) satisfies  AnilistShowcaseMedia[]
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
