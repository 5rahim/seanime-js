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
import { AnilistMedia } from "@/lib/anilist/fragment"
import { Nullish } from "@/types/common"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeCollectionDocument, ShowcaseMediaFragment } from "@/gql/graphql"
import { PromiseBatch } from "@/lib/helpers/batch"
import _ from "lodash"
import { createLibraryEntry, LibraryEntry } from "@/lib/local-library/library-entry"
import { logger } from "@/lib/helpers/debug"


export async function retrieveLocalFilesAsLibraryEntries(settings: Settings, userName: Nullish<string>) {
    logger("repository/retrieveLocalFilesAsLibraryEntries").info("Start library entry creation")

    const files = await retrieveHydratedLocalFiles(settings, userName)
    // const files = filesWithMediaSnapshot as LocalFileWithMedia[]

    if (files && files.length > 0) {

        const localFilesWithNoMedia: LocalFileWithMedia[] = files.filter(n => !n.media)
        let entries: LibraryEntry[] = []
        let rejectedFiles: LocalFileWithMedia[] = []

        const localFilesWithMedia = files.filter(n => !!n.media)
        const allMedia = _.uniqBy(files.map(n => n.media), n => n?.id)

        const groupedByMediaId = _.groupBy(localFilesWithMedia, n => n.media!.id)

        for (let i = 0; i < Object.keys(groupedByMediaId).length; i++) {
            const mediaId = Object.keys(groupedByMediaId)[i]
            const mediaIdAsNumber = Number(mediaId)
            if (!isNaN(mediaIdAsNumber)) {
                const currentMedia = allMedia.find(media => media?.id === mediaIdAsNumber)
                const lFiles = localFilesWithMedia.filter(f => f.media?.id === mediaIdAsNumber)

                if (currentMedia) {
                    const { rejectedFiles: rejected, ...newEntry } = await createLibraryEntry({
                        media: currentMedia,
                        files: lFiles,
                    })
                    rejectedFiles = [...rejectedFiles, ...rejected] // Return rejected files
                    entries = [...entries, newEntry] // Return new entry
                }

            }
        }

        // Remove media from localFilesWithNoMedia and rejectedFiles
        const filesWithNoMatch: LocalFile[] = [...localFilesWithNoMedia, ...rejectedFiles].map(obj => _.omit(obj, "media"))

        logger("repository/retrieveLocalFilesAsLibraryEntries").success("Library entry creation successful")
        return {
            entries,
            filesWithNoMatch,
        }
    }

    return undefined
}

/**
 * Recursively get the files from the local directory
 * This method hydrates each file retrieved using [retrieveLocalFiles] with its associated [AnilistSimpleMedia]
 * @param settings
 */
export async function retrieveHydratedLocalFiles(settings: Settings, userName: Nullish<string>) {
    const currentPath = settings.library.localDirectory

    if (currentPath && userName) {

        logger("repository/retrieveHydratedLocalFiles").info("Fetching user media list")
        const data = await useAniListAsyncQuery(AnimeCollectionDocument, { userName })

        const localFiles: LocalFile[] = []
        await getAllFilesRecursively(settings, currentPath, localFiles)

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
        ) ?? []) as ShowcaseMediaFragment[]

        // \/ Used before using PromiseBatch
        // const localFilesWithMedia: LocalFileWithMedia[] = []
        // for (let i = 0; i < localFiles.length; i++) {
        //     const created = await createLocalFileWithMedia(localFiles[i], allUserMedia, relatedMedia)
        //     if (created) localFilesWithMedia.push(created)
        // }
        // return localFilesWithMedia

        allUserMedia = allUserMedia?.map(media => _.omit(media, "streamingEpisodes", "relations", "studio", "description", "format", "source", "isAdult", "genres", "trailer", "countryOfOrigin", "studios"))

        logger("repository/retrieveHydratedLocalFiles").info("Hydrating local files")
        const res = (await PromiseBatch(createLocalFileWithMedia, localFiles, allUserMedia, relatedMedia, 100)) as LocalFileWithMedia[]
        logger("repository/retrieveHydratedLocalFiles").success("Finished hydrating")

        return res

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
        await getAllFilesRecursively(settings, currentPath, files)
        // await mock_getAllFilesRecursively(settings, currentPath, files)
        return files
    }
    return undefined
}

/**
 * Recursively get the files as [LocalFile] type
 * This method modifies the `files` argument
 * @param directoryPath
 * @param files
 * @param allowedTypes
 */
async function getAllFilesRecursively(
    settings: Settings,
    directoryPath: string,
    files: LocalFile[],
    allowedTypes: string[] = ["mkv", "mp4"],
): Promise<void> {
    const items: Dirent[] = await fs.readdir(directoryPath, { withFileTypes: true })

    logger("repository/getAllFilesRecursively").info("Getting all files recursively")
    for (const item of items) {
        const itemPath = path.join(directoryPath, item.name)
        const stats = await fs.stat(itemPath)

        if (stats.isFile() && allowedTypes.some(type => itemPath.endsWith(`.${type}`))) {
            files.push(await createLocalFile(settings, {
                name: item.name,
                path: itemPath,
            }))
        } else if (stats.isDirectory()) {
            await getAllFilesRecursively(settings, itemPath, files)
        }
    }
}
