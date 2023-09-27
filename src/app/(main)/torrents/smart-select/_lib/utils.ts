import rakun from "@/lib/rakun"
import path from "path"
import { path_getDirectoryName } from "@/lib/helpers/path"
import { TorrentFile } from "@/lib/download/qbittorrent/types"

type Input = { info: TorrentFile, originalName: string, parsed: ParsedTorrentInfo }
type Output = Input & {
    trueEpisode?: number
    season?: number
}

/**
 * @description Purpose
 * - Get torrent files, normalize episode numbers
 * @param array
 */
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
