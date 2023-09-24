"use server"
import { Dirent } from "fs"
import fs from "fs/promises"
import { logger } from "@/lib/helpers/debug"
import rakun from "@/lib/rakun"
import _ from "lodash"

export async function getMediaTitlesFromLocalDirectory(
    directoryPath: string,
) {
    try {
        let fileNames = new Set<string>()
        let titles = new Set<string>()
        let items: { title: string, parsed: ParsedTorrentInfo }[] = []
        const dirents: Dirent[] = await fs.readdir(directoryPath, { withFileTypes: true })

        logger("repository/getMediaTitlesFromLocalDirectory").info("Getting all file fileNames")
        for (const item of dirents) {
            if (item.name.match(/^(.*\.mkv|.*\.mp4|[^.]+)$/)) {
                fileNames.add(item.name.replace(/(.mkv|.mp4)/, ""))
            }
        }
        for (const name of fileNames) {
            const parsed = rakun.parse(name)
            if (parsed?.name) {
                titles.add(parsed?.name)
                items.push({ title: parsed.name, parsed })
            }
        }
        return {
            fileNames: [...fileNames],
            titles: _.orderBy([...titles], [n => n, n => n.length], ["asc", "asc"]),
            items: _.orderBy([...items], [n => n.title, n => n.title.length], ["asc", "asc"]),
        }
    } catch (e) {
        logger("repository/getMediaTitlesFromLocalDirectory").error("Failed")
        return undefined
    }
}
