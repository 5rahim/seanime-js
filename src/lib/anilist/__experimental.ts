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
        const items: Dirent[] = await fs.readdir(directoryPath, { withFileTypes: true })

        logger("repository/getAllMediaTitles").info("Getting all file fileNames")
        for (const item of items) {
            if (item.name.match(/^(.*\.mkv|.*\.mp4|[^.]+)$/)) {

                fileNames.add(item.name.replace(/(.mkv|.mp4)/, ""))

            }
        }
        for (const name of fileNames) {
            titles.add(rakun.parse(name)?.name?.trim() ?? undefined)
        }
        return {
            fileNames: [...fileNames],
            titles: _.orderBy([...titles], [n => n, n => n.length], ["asc", "asc"]),
            // titles: [].reduceRight((prev, curr) => prev.some(n => n.toLowerCase().includes(curr)) ? prev.filter(n => n !== prev.find(n => n.toLowerCase().includes(curr))) : prev, _.orderBy([...titles], [n => n, n => n.length], ["asc", "asc"]))
        }
    } catch (e) {
        logger("repository/getAllMediaTitles").error("Failed")
        return undefined
    }
}


async function PromiseBatch(task: any, items: any, batchSize: number) {
    let position = 0
    let results: any[] = []
    while (position < items.length) {
        const itemsForBatch = items.slice(position, position + batchSize)
        results = [...results, ...await Promise.all(itemsForBatch.map((item: any) => task(item)))]
        position += batchSize
    }
    return results
}
