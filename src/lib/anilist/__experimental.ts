"use server"

import { MediaSort, MediaStatus } from "@/gql/graphql"
import { Dirent } from "fs"
import fs from "fs/promises"
import { logger } from "@/lib/helpers/debug"
import rakun from "@/lib/rakun"
import _ from "lodash"
import { searchUniqueWithAnilist } from "@/lib/anilist/actions"
import { AnilistShortMedia } from "@/lib/anilist/fragment"

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

/**
 * From Miru, unused
 * @deprecated
 * @param name
 */
export async function resolveTitle(name: string) {
    const method = {
        name,
        method: "SearchName",
        perPage: 10,
        status: ["RELEASING", "FINISHED"],
        sort: "SEARCH_MATCH",
    } as { name: string, method: string, perPage: number, status: MediaStatus[], sort: MediaSort }

    let media: AnilistShortMedia | null | undefined = null
    try {
        // change S2 into Season 2 or 2nd Season
        const match = method.name.match(/ S(\d+)/)
        const oldname = method.name
        if (match) {
            if (Number(match[1]) === 1) { // if this is S1, remove the " S1" or " S01"
                method.name = method.name.replace(/ S(\d+)/, "")
                media = (await searchUniqueWithAnilist(method))?.Page?.media?.[0]
            } else {
                method.name = method.name.replace(/ S(\d+)/, ` ${Number(match[1])}${postfix[Number(match[1])] || "th"} Season`)
                media = (await searchUniqueWithAnilist(method))?.Page?.media?.[0]
                if (!media) {
                    method.name = oldname.replace(/ S(\d+)/, ` Season ${Number(match[1])}`)
                    media = (await searchUniqueWithAnilist(method))?.Page?.media?.[0]
                }
            }
        } else {
            media = (await searchUniqueWithAnilist(method))?.Page?.media?.[0]
        }

        // remove - :
        if (!media) {
            const match = method.name.match(/[-:]/g)
            if (match) {
                method.name = method.name.replace(/[-:]/g, "")
                media = (await searchUniqueWithAnilist(method))?.Page?.media?.[0]
            }
        }
        // remove (TV)
        if (!media) {
            const match = method.name.match(/\(TV\)/)
            if (match) {
                method.name = method.name.replace("(TV)", "")
                media = (await searchUniqueWithAnilist(method))?.Page?.media?.[0]
            }
        }
        // remove 2020
        if (!media) {
            const match = method.name.match(/ (19[5-9]\d|20\d{2})/)
            if (match) {
                method.name = method.name.replace(/ (19[5-9]\d|20\d{2})/, "")
                media = (await searchUniqueWithAnilist(method))?.Page?.media?.[0]
            }
        }
    } catch (e) {
    }

    return media

}

//
//
// export async function resolveFileMedia (fileName: any) {
//     let parseObj = await rakun.parse(fileName) as ParsedTorrentInfo
//
//     let parseObjs = [parseObj] as ParsedTorrentInfo[]
//     // batches promises in 10 at a time, because of CF burst protection, which still sometimes gets triggered :/
//     await PromiseBatch(resolveTitle, [...new Set(parseObjs.map(obj => obj.name))].filter(title => !(title in relations)), 10)
//     const fileMedias = []
//     for (const parseObj of parseObjs) {
//         let failed = false
//         let episode
//         let media = relations[parseObj.name]
//         // resolve episode, if movie, dont.
//         const maxep = media?.nextAiringEpisode?.episode || media?.episodes
//         if ((media?.format !== 'MOVIE' || maxep) && parseObj.episode) {
//                 if (maxep && parseInt(parseObj.episode) > maxep) {
//                     // see big comment above
//                     const prequel = !parseObj.season && (findEdge(media, 'PREQUEL')?.node || ((media.format === 'OVA' || media.format === 'ONA') && findEdge(media, 'PARENT')?.node))
//                     const root = prequel && (await resolveSeason({ media: (await useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: prequel.id }))?.Media, episode: undefined, force: true }))?.media
//
//                     // value bigger than episode count
//                     const result = await resolveSeason({ media: root || media, episode: parseInt(parseObj.episode), increment: !parseObj.season ? null : true, force: false })
//                     media = result?.rootMedia
//                     episode = result?.episode
//                     failed = false
//                 } else {
//                     // cant find ep count or episode seems fine
//                     episode = Number(parseObj.episode)
//                 }
//         }
//         fileMedias.push({
//             episode: episode || parseObj.episode,
//             parseObject: parseObj,
//             media,
//         })
//     }
//     return fileMedias
// }
//

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
        fileNames.add("[Judas] Jigokuraku (Hell's Paradise) - S01E13 [1080p][HEVC x265 10bit][Multi-Subs] (Weekly)")
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
