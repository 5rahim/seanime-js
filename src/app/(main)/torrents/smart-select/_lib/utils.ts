import rakun from "@/lib/rakun"
import path from "path"
import { path_getDirectoryName } from "@/lib/helpers/path"
import { TorrentFile } from "@/lib/download/qbittorrent/types"

type Input = { info: TorrentFile, originalName: string, parsed: ParsedTorrentInfo }
type Output = Input & {
    trueEpisode?: number
    season?: number
}

export function smartSelect_normalizeEpisodes(array: Input[]): Output[] {
    // Create a mapping of unique parent folders to files
    const folderToFileMap: Record<string, Input[]> = {}
    array.forEach((item) => {
        const { info: { name } } = item
        const folderPath = path_getDirectoryName(name)

        if (folderPath in folderToFileMap) {
            folderToFileMap[folderPath].push(item)
        } else {
            folderToFileMap[folderPath] = [item]
        }
    })

    // Normalize episode numbers within each folder group
    const result: Output[] = []
    Object.values(folderToFileMap).forEach((files) => {
        const folderEpisodes: number[] = []
        files.forEach((item) => {
            const episodeNumber = Number(item.parsed.episode)
            folderEpisodes.push(episodeNumber)
        })

        // Sort episodes in ascending order
        folderEpisodes.sort((a, b) => a - b)

        files.forEach((item) => {
            const { info: { name }, originalName } = item
            const episodeNumber = Number(item.parsed.episode)

            const folderParsed = rakun.parse(path_getDirectoryName(name)?.split(path.sep).pop() || "")
            const parsed = rakun.parse(originalName)

            // Unused - Might use this to choose the appropriate season
            const season = (!!folderParsed?.season || !!parsed?.season) ? Number(folderParsed?.season || parsed?.season) : undefined

            // Calculate trueEpisode based on the position in the sorted array
            const trueEpisode = folderEpisodes.indexOf(episodeNumber) + 1
            result.push({ ...item, trueEpisode, season })
        })
    })

    return result
}

// OLD VERSION
// export function smartSelect_normalizeEpisodes(array: Input[]): Output[] {
//     // Create a mapping of unique parent folders to episode ranges
//     const folderToEpisodeRangeMap: Record<string, { start: number; end: number }> = {}
//     array.forEach((item) => {
//         const { info: { name }, parsed: { episode } } = item
//         const folderPath = name.substring(0, name.lastIndexOf("\\"))
//         const episodeNumber = Number(episode) // Convert episode to a number
//
//         if (folderPath in folderToEpisodeRangeMap) {
//             folderToEpisodeRangeMap[folderPath].end = Math.max(
//                 folderToEpisodeRangeMap[folderPath].end,
//                 episodeNumber,
//             )
//         } else {
//             folderToEpisodeRangeMap[folderPath] = {
//                 start: episodeNumber,
//                 end: episodeNumber,
//             }
//         }
//     })
//
//     // Normalize episode numbers within each folder group
//     const result: Output[] = []
//     array.forEach((item) => {
//         const { info: { name }, originalName, parsed: { episode } } = item
//
//         const folderPath = name?.substring(0, name.lastIndexOf("\\"))
//         const { start, end } = folderToEpisodeRangeMap[folderPath]
//
//         const folderParsed = folderPath ? rakun.parse(folderPath.split("\\")[folderPath.split("\\").length - 1]) : undefined
//         const parsed = rakun.parse(originalName)
//
//         // Unused - Might use this to choose appropriate season
//         const season = (!!folderParsed?.season || !!parsed?.season) ? Number(folderParsed?.season || parsed?.season) : undefined
//
//         const episodeNumber = Number(episode) // Convert episode to a number
//         const trueEpisode = episodeNumber - start + 1
//         result.push({ ...item, trueEpisode, season })
//     })
//
//     return result
// }
