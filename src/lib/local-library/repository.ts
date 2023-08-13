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
import { AnimeCollectionDocument } from "@/gql/graphql"


export async function retrieveLocalFilesAsLibraryEntries() {

}

export async function getAnimeTitlesFromLocalFiles() {

}


/**
 * Recursively get the files from the local directory
 * This method is an implementation of [retrieveLocalFiles]
 * - This method transforms the files from [LocalFile] to [LocalFileWithMedia]
 * @param settings
 */
export async function _toLocalFilesWithMedia(settings: Settings, userName: Nullish<string>) {
    const currentPath = settings.library.localDirectory

    if (currentPath && userName) {

        const data = await useAniListAsyncQuery(AnimeCollectionDocument, { userName })

        const localFiles: LocalFile[] = []
        await getAllFilesRecursively(settings, currentPath, localFiles)

        const allUserMedia = data.MediaListCollection?.lists?.map(n => n?.entries).flat().filter(entry => !!entry).map(entry => entry!.media) as AnilistMedia[] | undefined

        const localFilesWithMedia: LocalFileWithMedia[] = []
        for (let i = 0; i < localFiles.length; i++) {
            const created = await createLocalFileWithMedia(localFiles[i], allUserMedia)
            if (created) localFilesWithMedia.push(created)
        }
        return localFilesWithMedia

    }
    return undefined
}

/**
 * Recursively get the files from the local directory
 * This method is an implementation of [getAllFilesRecursively]
 * @param settings
 */
export async function retrieveLocalFiles(settings: Settings) {
    const currentPath = settings.library.localDirectory

    if (currentPath) {
        const files: LocalFile[] = []
        await getAllFilesRecursively(settings, currentPath, files)
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
