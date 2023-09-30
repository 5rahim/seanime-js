"use server"

import fs from "fs/promises"
import { Settings } from "@/atoms/settings"
import { runCommand } from "@/lib/helpers/child-process"
import { directoryExists, fileOrDirectoryExists } from "@/lib/helpers/file"
import path from "path"
import { path_getDirectoryName } from "@/lib/helpers/path"
import { logger } from "@/lib/helpers/debug"

export async function getSafeFoldersFromDirectory(_path: string): Promise<{ data: { name: string, path: string }[], error: string | null, parentFolder: string | null }> {
    if (_path && path.isAbsolute(_path)) {

        const parentPath = path_getDirectoryName(_path)

        if (!await directoryExists(_path)) {
            return { data: [], error: "Directory does not exist", parentFolder: parentPath }
        }

        try {
            const folders = await fs.readdir(_path, { withFileTypes: true })
            return {
                data: folders.filter(dirent => dirent.isDirectory()).map(folder => ({
                    name: folder.name,
                    path: path.join(folder.path, folder.name),
                })),
                error: null,
                parentFolder: parentPath,
            }
        } catch (e) {
            return { data: [], error: "Could not retrieve folders", parentFolder: parentPath }
        }
    } else {
        return { data: [], error: "Empty path", parentFolder: null }
    }
}



export async function openLocalDirectoryInExplorer(settings: Settings) {
    const path = settings.library.localDirectory
    const osType = process.platform

    let explorer
    switch (osType) {
        case "win32":
            explorer = "explorer"
            break
        case "linux":
            explorer = "xdg-open"
            break
        case "darwin":
            explorer = "open"
            break
    }

    if (path && await fileOrDirectoryExists(path)) {
        await runCommand(`${explorer} "${path}"`)
    }
}


export async function openDirectoryInExplorer(path: string) {

    let explorer
    const osType = process.platform
    switch (osType) {
        case "win32":
            explorer = "explorer"
            break
        case "linux":
            explorer = "xdg-open"
            break
        case "darwin":
            explorer = "open"
            break
    }

    if (path && await fileOrDirectoryExists(path)) {
        logger("helpers/directory").info("Opening directory in explorer", path)
        await runCommand(`${explorer} "${path}"`)
    }
}
