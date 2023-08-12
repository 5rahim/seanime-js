"use server"
import { Settings } from "@/atoms/settings"
import path from "path"
import fs from "fs/promises"
import { Dirent } from "fs"
import { createLocalFile, LocalFile } from "@/lib/local-library/local-file"


export async function retrieveLocalFiles(settings: Settings) {
    const currentPath = settings.library.localDirectory

    if (currentPath) {
        const files: LocalFile[] = []
        await getAllFilesRecursively(currentPath, files)
        return files
    }
    return undefined

}

/**
 * Recursively get the files as [LocalFile] type
 * @param directoryPath
 * @param files
 * @param allowedTypes
 */
async function getAllFilesRecursively(
    directoryPath: string,
    files: LocalFile[],
    allowedTypes: string[] = ["mkv", "mp4"],
): Promise<void> {
    const items: Dirent[] = await fs.readdir(directoryPath, { withFileTypes: true })

    for (const item of items) {
        const itemPath = path.join(directoryPath, item.name)
        const stats = await fs.stat(itemPath)

        if (stats.isFile() && allowedTypes.some(type => itemPath.endsWith(`.${type}`))) {
            files.push(createLocalFile({
                title: item.name,
                path: itemPath,
            }))
        } else if (stats.isDirectory()) {
            await getAllFilesRecursively(itemPath, files)
        }
    }
}
