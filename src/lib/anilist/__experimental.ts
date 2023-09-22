"use server"

import { Dirent } from "fs"
import fs from "fs/promises"
import { logger } from "@/lib/helpers/debug"
import rakun from "@/lib/rakun"
import _ from "lodash"

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

// resolve anime name based on file name and store it
const postfix: { [key: number]: string } = {
    1: "st",
    2: "nd",
    3: "rd",
}

export async function getAllFileNames(
    directoryPath: string,
    stop: boolean = false,
) {
    try {
        let fileNames = new Set<string>()
        let titles = new Set<string>()
        const items: Dirent[] = await fs.readdir(directoryPath, { withFileTypes: true })

        logger("repository/getAllFileNames").info("Getting all file fileNames")
        for (const item of items) {
            if (item.name.match(/^(.*\.mkv|.*\.mp4|[^.]+)$/)) {

                fileNames.add(item.name.replace(/(.mkv|.mp4)/, ""))
                // const itemPath = path.join(directoryPath, item.name)
                // const stats = await fs.stat(itemPath)
                // if(stats.isDirectory() && !stop) {
                //     const res = await getAllFileNames(itemPath, true)
                //     res?.fileNames?.map(n => {
                //         titles.add(rakun.parse(n)?.name?.trim() ?? undefined)
                //     })
                // }

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
        logger("repository/getAllFileNames").error("Failed")
        return undefined
    }
}
