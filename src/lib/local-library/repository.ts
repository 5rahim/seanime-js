/* -------------------------------------------------------------------------------------------------
 * Repository actions
 * -----------------------------------------------------------------------------------------------*/
"use server"
import { Settings } from "@/atoms/settings"
import path from "path"
import fs from "fs/promises"
import { Dirent } from "fs"
import {
    createLocalFile,
    createLocalFileWithMedia,
    LocalFile,
    LocalFileWithMedia,
} from "@/lib/local-library/local-file"
import { AnilistMedia, AnilistSimpleMedia } from "@/lib/anilist/fragment"
import { Nullish } from "@/types/common"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeCollectionDocument, AnimeCollectionQuery, UpdateEntryDocument } from "@/gql/graphql"
import { PromiseBatch } from "@/lib/helpers/batch"
import _ from "lodash"
import { createLibraryEntry, LibraryEntry } from "@/lib/local-library/library-entry"
import { logger } from "@/lib/helpers/debug"

/**
 *  Goes through non-locked and non-ignored [LocalFile]s and returns
 *  - Scanned [LocalFile]s and their associated [LibraryEntry]s
 * @param settings
 * @param userName
 * @param token
 * @param ignored
 * @param locked
 */
export async function retrieveLocalFilesAsLibraryEntries(settings: Settings, userName: Nullish<string>, token: string, {
    ignored,
    locked,
}: { ignored: string[], locked: string[] }) {

    logger("repository/retrieveLocalFilesAsLibraryEntries").info("Fetching user media list")
    const data = await useAniListAsyncQuery(AnimeCollectionDocument, { userName })
    const watchListMediaIds = new Set(data.MediaListCollection?.lists?.filter(n => n?.entries).flatMap(n => n?.entries?.map(n => n?.media)).map(n => n?.id).filter(Boolean))

    logger("repository/retrieveLocalFilesAsLibraryEntries").info("Start library entry creation")
    const files = await retrieveHydratedLocalFiles(settings, userName, data, { ignored, locked })
    // const files = filesWithMediaSnapshot as LocalFileWithMedia[]

    if (files && files.length > 0) {

        const filesWithNoMedia: LocalFileWithMedia[] = files.filter(n => !n.media) // Get files with no media
        const localFilesWithMedia = files.filter(n => !!n.media) // Successfully matches files
        const allMedia = _.uniqBy(files.map(n => n.media), n => n?.id)

        /** Values to be returned **/
        let entries: LibraryEntry[] = []
        let checkedFiles: LocalFile[] = [...filesWithNoMedia.map(f => _.omit(f, "media"))]

        const groupedByMediaId = _.groupBy(localFilesWithMedia, n => n.media!.id)

        for (let i = 0; i < Object.keys(groupedByMediaId).length; i++) {
            const mediaId = Object.keys(groupedByMediaId)[i]
            const mediaIdAsNumber = Number(mediaId)
            if (!isNaN(mediaIdAsNumber)) {
                const currentMedia = allMedia.find(media => media?.id === mediaIdAsNumber)
                const lFiles = localFilesWithMedia.filter(f => f.media?.id === mediaIdAsNumber)

                if (currentMedia) {
                    const { acceptedFiles, rejectedFiles, ...newEntry } = await createLibraryEntry({
                        media: currentMedia,
                        files: lFiles,
                    })
                    if (newEntry.filePaths.length > 0) {
                        entries = [...entries, newEntry] // Return new entry only if it has files
                    }
                    checkedFiles = [
                        ...checkedFiles,
                        // Set media id for accepted files
                        ...acceptedFiles.map(f => _.omit(f, "media")).map(file => ({
                            ...file,
                            mediaId: currentMedia.id,
                        })),
                        ...rejectedFiles.map(f => _.omit(f, "media")),
                    ]

                    if (!watchListMediaIds.has(currentMedia.id)) {
                        try {
                            const mutation = await useAniListAsyncQuery(UpdateEntryDocument, {
                                mediaId: currentMedia.id, //Int
                                status: "PLANNING", //MediaListStatus
                            }, token)
                        } catch (e) {
                            logger("repository/retrieveLocalFilesAsLibraryEntries").error("Couldn't add media to watch list")
                        }
                    }
                }

            }
        }

        logger("repository/retrieveLocalFilesAsLibraryEntries").success("Library entry creation successful")
        return {
            /**
             * All entries found with up-to-date paths
             * @deprecated Will be replaced by just sending down the ids
             */
            entries,
            // mediaIds: entries.map(entry => entry.media.id),
            /**
             * Non-locked and non-ignored retrieved files with up-to-date meta (mediaIds, paths...)
             */
            checkedFiles,
        }
    }

    return undefined
}

/**
 * Recursively get the files from the local directory
 * This method hydrates each retrieved [LocalFile] with its associated [AnilistSimpleMedia]
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
) {
    const currentPath = settings.library.localDirectory

    if (currentPath && userName) {


        const localFiles: LocalFile[] = []
        await getAllFilesRecursively(settings, currentPath, localFiles, { ignored, locked }) // <-----------------

        if (localFiles.length > 0) {
            let allUserMedia = data.MediaListCollection?.lists?.map(n => n?.entries).flat().filter(entry => !!entry).map(entry => entry!.media) as AnilistMedia[] | undefined
            logger("repository/retrieveHydratedLocalFiles").info("Formatting related media")

            // Get sequels, prequels... from each media as [ShowcaseMediaFragment]
            let relatedMedia = ((
                allUserMedia?.filter(media => !!media)
                    .flatMap(media => media.relations?.edges?.filter(edge => edge?.relationType === "PREQUEL"
                            || edge?.relationType === "SEQUEL"
                            || edge?.relationType === "SPIN_OFF"
                            || edge?.relationType === "SIDE_STORY"
                            || edge?.relationType === "ALTERNATIVE"
                            || edge?.relationType === "PARENT",
                        ).flatMap(edge => edge?.node).filter(Boolean)
                        ?? [])
            ) ?? []) as AnilistSimpleMedia[]

            allUserMedia = allUserMedia?.map(media => _.omit(media, "streamingEpisodes", "relations", "studio", "description", "format", "source", "isAdult", "genres", "trailer", "countryOfOrigin", "studios"))

            logger("repository/retrieveHydratedLocalFiles").info("Hydrating local files")
            const res = (await PromiseBatch(createLocalFileWithMedia, localFiles, allUserMedia, relatedMedia, 100)) as LocalFileWithMedia[]
            logger("repository/retrieveHydratedLocalFiles").success("Finished hydrating")

            return res
        }

    }
    return undefined
}

/**
 * Recursively get the files from the local directory
 * This method is an implementation of [getAllFilesRecursively]
 * @param settings
 */
export async function retrieveLocalFilesFrom(settings: Settings) {
    const currentPath = settings.library.localDirectory

    logger("local-library/repository").info("Retrieving local files")
    if (currentPath) {
        const files: LocalFile[] = []
        // await getAllFilesRecursively(settings, currentPath, files)
        // await mock_getAllFilesRecursively(settings, currentPath, files)
        return files
    }
    return undefined
}

/**
 * Recursively get the files as [LocalFile] type
 * This method modifies the `files` argument
 * @param settings
 * @param directoryPath
 * @param files
 * @param ignored
 * @param locked
 * @param allowedTypes
 */
async function getAllFilesRecursively(
    settings: Settings,
    directoryPath: string,
    files: LocalFile[],
    { ignored, locked }: { ignored: string[], locked: string[] },
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
                files.push(await createLocalFile(settings, {
                    name: item.name,
                    path: itemPath,
                }))
            } else if (stats.isDirectory()) {

                const dirents = await fs.readdir(itemPath, { withFileTypes: true })
                const fileNames = dirents.filter(dirent => dirent.isFile()).map(dirent => dirent.name)
                if (!fileNames.find(name => name === ".unsea")) {
                    await getAllFilesRecursively(settings, itemPath, files, { ignored, locked })
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

        let ignoredPathsToClean: string[] = []
        let lockedPathsToClean: string[] = []

        const directoryPath = settings.library.localDirectory

        if (directoryPath) {

            for (const path of ignored) {
                try {
                    const stats = await fs.stat(path)
                } catch (e) {
                    ignoredPathsToClean.push(path)
                }
            }
            for (const path of locked) {
                try {
                    const stats = await fs.stat(path)
                } catch (e) {
                    lockedPathsToClean.push(path)
                }
            }
        }

        return {
            ignoredPathsToClean,
            lockedPathsToClean,
        }
    } catch (e) {
        logger("repository/cleanupFiles").error("Failed")
        return {
            ignoredPathsToClean: [],
            lockedPathsToClean: [],
        }
    }
}
