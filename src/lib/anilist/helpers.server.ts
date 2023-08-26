"use server"
import { findMediaEdge } from "@/lib/anilist/helpers.shared"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeShortMediaByIdDocument } from "@/gql/graphql"
import { AnilistShortMedia } from "@/lib/anilist/fragment"

/**
 * {@link https://github.com/ThaUnknown/miru/blob/master/src/renderer/modules/anime.js#L317}
 * @param opts
 */
export async function resolveSeason(opts: {
    media: AnilistShortMedia | null | undefined,
    episode?: number | null,
    increment?: boolean | null,
    offset?: number,
    rootMedia?: AnilistShortMedia,
    force?: boolean
}) {
    // media, episode, increment, offset, force
    if (!opts.media || !(opts.episode || opts.force)) return undefined

    let { media, episode, increment, offset = 0, rootMedia = opts.media, force } = opts

    // Get the highest episode of the root media
    const rootHighest = (rootMedia.nextAiringEpisode?.episode || rootMedia.episodes!)
    // Find prequel if we don't increment
    const prequel = !increment ? findMediaEdge(media, "PREQUEL")?.node : undefined
    // Find prequel if there's no prequel, and we increment, find sequel
    const sequel = (!prequel && (increment || increment === null)) ? findMediaEdge(media, "SEQUEL")?.node : undefined
    // Edge is either the prequel or sequel
    const edge = prequel || sequel

    // For recursive, reset increment to: whether we increment or there is no prequel
    increment = increment ?? !prequel

    if (!edge) {
        const obj = { media, episode: episode! - offset, offset, increment, rootMedia, failed: true }
        if (!force) {
            // console.warn("Error in parsing!", obj)
            // toast('Parsing Error', {
            //     description: `Failed resolving anime episode!\n${media.title.userPreferred} - ${episode - offset}`
            // })
        }
        return obj
    }
    media = (await useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: edge.id })).Media!

    const highest = media.nextAiringEpisode?.episode || media.episodes!

    const diff = episode! - (highest + offset)
    offset += increment ? rootHighest : highest
    if (increment) rootMedia = media

    // force marches till end of tree, no need for checks
    if (!force && diff <= rootHighest) {
        episode! -= offset
        return { media, episode, offset, increment, rootMedia }
    }

    return resolveSeason({ media, episode, increment, offset, rootMedia, force })
}

/* -------------------------------------------------------------------------------------------------
 * Testing code from Miru
 * -----------------------------------------------------------------------------------------------*/

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

// export async function alSearch ({ name, ...method }: {name: string, method: string, perPage: number, status: MediaStatus[], sort: MediaSort}) {
//     const res = await useAniListAsyncQuery(SearchAnimeShortMediaDocument, { search: name, ...method })
//     const media = res.Page?.media?.filter(Boolean).map(media => getDistanceFromTitle(media, [name]))
//     if (!media?.length) return res
//     const lowest = media.reduce((prev, curr) => prev.distance <= curr.distance ? prev : curr)
//     return { Page: { media: [lowest] } }
// }
//
// const relations: any = {}
//
// // resolve anime name based on file name and store it
// const postfix: { [key: number]: string } = {
//     1: 'st',
//     2: 'nd',
//     3: 'rd'
// }
//
//
// async function resolveTitle (name: string) {
//     const method = { name, method: 'SearchName', perPage: 10, status: ['RELEASING', 'FINISHED'], sort: 'SEARCH_MATCH' } as {name: string, method: string, perPage: number, status: MediaStatus[], sort: MediaSort}
//
//     // inefficient but readable
//
//     let media = null
//     try {
//         // change S2 into Season 2 or 2nd Season
//         const match = method.name.match(/ S(\d+)/)
//         const oldname = method.name
//         if (match) {
//             if (Number(match[1]) === 1) { // if this is S1, remove the " S1" or " S01"
//                 method.name = method.name.replace(/ S(\d+)/, '')
//                 media = (await alSearch(method))?.Page?.media?.[0]
//             } else {
//                 method.name = method.name.replace(/ S(\d+)/, ` ${Number(match[1])}${postfix[Number(match[1])] || 'th'} Season`)
//                 media = (await alSearch(method))?.Page?.media?.[0]
//                 if (!media) {
//                     method.name = oldname.replace(/ S(\d+)/, ` Season ${Number(match[1])}`)
//                     media = (await alSearch(method))?.Page?.media?.[0]
//                 }
//             }
//         } else {
//             media = (await alSearch(method))?.Page?.media?.[0]
//         }
//
//         // remove - :
//         if (!media) {
//             const match = method.name.match(/[-:]/g)
//             if (match) {
//                 method.name = method.name.replace(/[-:]/g, '')
//                 media = (await alSearch(method))?.Page?.media?.[0]
//             }
//         }
//         // remove (TV)
//         if (!media) {
//             const match = method.name.match(/\(TV\)/)
//             if (match) {
//                 method.name = method.name.replace('(TV)', '')
//                 media = (await alSearch(method))?.Page?.media?.[0]
//             }
//         }
//         // remove 2020
//         if (!media) {
//             const match = method.name.match(/ (19[5-9]\d|20\d{2})/)
//             if (match) {
//                 method.name = method.name.replace(/ (19[5-9]\d|20\d{2})/, '')
//                 media = (await alSearch(method))?.Page?.media?.[0]
//             }
//         }
//     } catch (e) { }
//
//     if (media) relations[name] = media
// }
//
//
// export async function resolveFileMedia (fileName: any) {
//     let parseObj = await rakun.parse(fileName) as TorrentInfos
//
//     let parseObjs = [parseObj] as TorrentInfos[]
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
// function getDistanceFromTitle(media: AnilistShowcaseMedia, values: string[]) {
//     if (media && media.title) {
//
//         const titles = Object.values(media.title).filter(Boolean).flatMap(title => values.map(unit => lavenshtein(title!.toLowerCase(), unit!.toLowerCase())))
//
//         const synonymsWithSeason = media.synonyms?.filter(Boolean)
//             .filter(valueContainsSeason)
//             .flatMap(title => values.map(unit => lavenshtein(title.toLowerCase(), unit.toLowerCase()))) // If synonym has "season", remove padding
//
//         const distances = [...(synonymsWithSeason || []), ...titles]
//         const min = distances.length > 0 ? distances.reduce((prev, curr) => prev < curr ? prev : curr) : 999999999999999
//         return {
//             media,
//             distance: min,
//         } // Return the minimum distance
//     }
//     return {
//         media: undefined,
//         distance: 99999,
//     }
// }
