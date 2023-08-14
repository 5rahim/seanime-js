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

        // const uniqueAnimeTitles = _.uniq(localFiles.flatMap(file => [file.parsedInfo?.title, ...file.parsedFolders.map(f2 => f2.title)]).filter(v => !!v))

        // console.log(uniqueAnimeTitles)

        const allUserMedia = data.MediaListCollection?.lists?.map(n => n?.entries).flat().filter(entry => !!entry).map(entry => entry!.media) as AnilistMedia[] | undefined

        // Get sequels, prequels... from each media as [ShowcaseMediaFragment]
        let relatedMedia = ((
            allUserMedia?.filter(media => !!media)
                .flatMap(media => media.relations?.edges?.filter(edge => edge?.relationType === "PREQUEL" || edge?.relationType === "SEQUEL" || edge?.relationType === "SPIN_OFF" || edge?.relationType === "SIDE_STORY").flatMap(edge => edge?.node)
                    ?? [])
        ) ?? []) as ShowcaseMediaFragment[]

        // let relatedMedia = (allUserMedia?.flatMap(media => media.relations?.nodes)?.filter(media => !!media) ?? []) as ShowcaseMediaFragment[]

        // console.log(relatedMedia.filter(n => n.title?.romaji?.toLowerCase().includes("one piece")))
        // console.log(allUserMedia?.filter(n => !n.title?.romaji?.includes("durara")))

        const localFilesWithMedia: LocalFileWithMedia[] = []
        for (let i = 0; i < localFiles.length; i++) {
            const created = await createLocalFileWithMedia(localFiles[i], allUserMedia, relatedMedia)
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
