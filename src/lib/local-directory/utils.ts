"use server"
import fs from "fs/promises"

export async function getDirectory(path: string) {
    try {
        const dir = await fs.opendir(path)
        return dir
    } catch (e) {
        return null
    }
}

export async function directoryExists(path: string) {
    return !!(await getDirectory(path))
}
