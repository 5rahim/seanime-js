"use server"

import fs from "fs/promises"
import { Settings } from "@/atoms/settings"
import { runCommand } from "@/lib/helpers/child-process"
import { fileOrDirectoryExists } from "@/lib/helpers/file"
import { PathLike } from "fs"

export async function openDirectory(path: PathLike) {
    if (path) {
        try {
            const dir = await fs.opendir(path, { recursive: true })
            return dir
        } catch (e) {
            // return null
        }
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
        await runCommand(`${explorer} "${path}"`)
    }
}
