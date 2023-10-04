"use server"
import { PathLike } from "fs"
import fs from "fs/promises"

/* -------------------------------------------------------------------------------------------------
 * Common
 * -----------------------------------------------------------------------------------------------*/

export async function fileExists(path: PathLike) {
    try {
        const stat = await fs.stat(path)
        return stat.isFile()

    } catch (e) {
        return false
    }
}
