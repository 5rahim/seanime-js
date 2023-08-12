"use server"

import fs from "fs/promises"
import { PathLike } from "fs"
import { Settings } from "@/atoms/settings"
import { runCommand } from "@/lib/helpers/child-process"
import { OsType } from "@tauri-apps/api/os"

export async function getDirectory(path: PathLike) {
    try {
        const dir = await fs.opendir(path)
        return dir
    } catch (e) {
        return null
    }
}

export async function directoryExists(path: PathLike) {
    try {
        await fs.stat(path)
        return true
    } catch (e) {
        return false
    }
}

export async function openLocalDirectory(settings: Settings, osType: OsType) {
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

    if (path && await directoryExists(path)) {
        await runCommand(`${explorer} "${path}"`)
    }
}
