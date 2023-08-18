"use server"

import fs from "fs/promises"
import { Settings } from "@/atoms/settings"
import { runCommand } from "@/lib/helpers/child-process"
import { OsType } from "@tauri-apps/api/os"
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

export async function openLocalDirectoryInExplorer(settings: Settings, osType: OsType) {
    const path = settings.library.localDirectory

    let explorer
    switch (osType) {
        case "Windows_NT":
            explorer = "explorer"
            break
        case "Linux":
            explorer = "xdg-open"
            break
        case "Darwin":
            explorer = "open"
            break
    }

    if (path && await fileOrDirectoryExists(path)) {
        await runCommand(`${explorer} "${path}"`)
    }
}


export async function openDirectoryInExplorer(path: string, osType: OsType) {

    let explorer
    switch (osType) {
        case "Windows_NT":
            explorer = "explorer"
            break
        case "Linux":
            explorer = "xdg-open"
            break
        case "Darwin":
            explorer = "open"
            break
    }

    if (path && await fileOrDirectoryExists(path)) {
        await runCommand(`${explorer} "${path}"`)
    }
}
