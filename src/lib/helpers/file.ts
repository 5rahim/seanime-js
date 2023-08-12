"use server"
import { PathLike } from "fs"
import fs from "fs/promises"

/* -------------------------------------------------------------------------------------------------
 * Library
 * -----------------------------------------------------------------------------------------------*/

export async function getFile(path: PathLike) {
    try {
        const file = await fs.open(path)
        return file
    } catch (e) {
        // return null
    }
}

export async function deleteFile() {

}

/* -------------------------------------------------------------------------------------------------
 * Common
 * -----------------------------------------------------------------------------------------------*/

export async function fileOrDirectoryExists(path: PathLike) {
    try {
        await fs.stat(path)
        return true
    } catch (e) {
        return false
    }
}
