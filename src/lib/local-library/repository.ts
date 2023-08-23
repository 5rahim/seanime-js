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
import _ from "lodash"
import { inspectProspectiveLibraryEntry } from "@/lib/local-library/library-entry"
import { logger } from "@/lib/helpers/debug"

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

    logger("repository/scanLocalFiles").info("Fetching user media list")
    const data = await useAniListAsyncQuery(AnimeCollectionDocument, { userName })
    const watchListMediaIds = new Set(data.MediaListCollection?.lists?.filter(n => n?.entries).flatMap(n => n?.entries?.map(n => n?.media)).map(n => n?.id).filter(Boolean))

    logger("repository/scanLocalFiles").info("Retrieving hydrated local files")
    const files = await retrieveHydratedLocalFiles(settings, userName, data, { ignored, locked })

    if (files && files.length > 0) {

        const filesWithNoMedia: LocalFileWithMedia[] = files.filter(n => !n.media) // Get files with no media
        const localFilesWithMedia = files.filter(n => !!n.media) // Successfully matches files
        const allMedia = _.uniqBy(files.map(n => n.media), n => n?.id)

        /** Values to be returned **/
        let checkedFiles: LocalFile[] = [...filesWithNoMedia.map(f => _.omit(f, "media"))]

        const groupedByMediaId = _.groupBy(localFilesWithMedia, n => n.media!.id)

        logger("repository/scanLocalFiles").info("Inspecting prospective library entry")
        for (let i = 0; i < Object.keys(groupedByMediaId).length; i++) {
            const mediaId = Object.keys(groupedByMediaId)[i]
            const mediaIdAsNumber = Number(mediaId)
            if (!isNaN(mediaIdAsNumber)) {
                const currentMedia = allMedia.find(media => media?.id === mediaIdAsNumber)
                const lFiles = localFilesWithMedia.filter(f => f.media?.id === mediaIdAsNumber)

                if (currentMedia) {
                    const { acceptedFiles, rejectedFiles } = await inspectProspectiveLibraryEntry({
                        media: currentMedia,
                        files: lFiles,
                    })
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
                            logger("repository/scanLocalFiles").error("Couldn't add media to watch list")
                        }
                    }
                }

            }
        }

        logger("repository/scanLocalFiles").success("Library scanned successfully", checkedFiles.length)
        return {
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
            let allUserMedia = data.MediaListCollection?.lists?.map(n => n?.entries).flat().filter(Boolean).map(entry => entry.media) ?? [] as AnilistMedia[]
            logger("repository/retrieveHydratedLocalFiles").info("Formatting related media")

            // Get sequels, prequels... from each media as [AnilistSimpleMedia]
            let relatedMedia = allUserMedia.filter(Boolean)
                .flatMap(media => media.relations?.edges?.filter(edge => (edge?.relationType === "PREQUEL"
                        || edge?.relationType === "SEQUEL"
                        || edge?.relationType === "SPIN_OFF"
                        || edge?.relationType === "SIDE_STORY"
                        || edge?.relationType === "ALTERNATIVE"
                        || edge?.relationType === "PARENT"),
                    )
                        .flatMap(edge => edge?.node).filter(Boolean),
                ) as AnilistSimpleMedia[]

            allUserMedia = allUserMedia.map(media => _.omit(media, "streamingEpisodes", "relations", "studio", "description", "format", "source", "isAdult", "genres", "trailer", "countryOfOrigin", "studios"))

            const allMedia = [...allUserMedia, ...relatedMedia].filter(Boolean).filter(media => media?.status === "RELEASING" || media?.status === "FINISHED") as AnilistSimpleMedia[]
            const mediaEngTitles = allMedia.map(media => media.title?.english).filter(Boolean)
            const mediaRomTitles = allMedia.map(media => media.title?.romaji).filter(Boolean)
            const mediaPreferredTitles = allMedia.map(media => media.title?.userPreferred).filter(Boolean)
            const seasonTitles = allMedia.flatMap(media => media.synonyms?.filter(syn => {
                return (
                    syn?.toLowerCase()?.includes("season") ||
                    syn?.toLowerCase()?.match(/\d(st|nd|rd|th) [Ss].*/)
                ) && !syn?.toLowerCase().includes("episode") && !syn?.toLowerCase().includes("第") && !syn?.toLowerCase().match(/\b(ova|special|special)\b/i)
            })).filter(Boolean)

            // console.log(seasonTitles)

            logger("repository/retrieveHydratedLocalFiles").info("Hydrating local files")
            let localFilesWithMedia: LocalFileWithMedia[] = []

            const matchingCache = new Map<string, AnilistSimpleMedia | undefined>()

            for (let i = 0; i < localFiles.length; i++) {
                const created = await createLocalFileWithMedia(
                    localFiles[i],
                    allMedia,
                    { eng: mediaEngTitles, rom: mediaRomTitles, preferred: mediaPreferredTitles, season: seasonTitles },
                    matchingCache,
                )
                if (created) {
                    localFilesWithMedia.push(created)
                }
            }
            matchingCache.clear()
            logger("repository/retrieveHydratedLocalFiles").success("Finished hydrating")

            return localFilesWithMedia
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
                if (!fileNames.find(name => name === ".unsea" || name === ".seaignore")) {
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

        let pathsToClean: string[] = []

        const directoryPath = settings.library.localDirectory

        if (directoryPath) {

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
