import { TorrentFile } from "@ctrl/qbittorrent"
import rakun from "@/lib/rakun/rakun"

type Input = { info: TorrentFile, originalName: string, parsed: TorrentInfos }
type Output = Input & {
    trueEpisode?: number
    season?: number
}

export function smartSelect_normalizeEpisodes(array: Input[]): Output[] {
    // Create a mapping of unique parent folders to episode ranges
    const folderToEpisodeRangeMap: Record<string, { start: number; end: number }> = {}
    array.forEach((item) => {
        const { info: { name }, parsed: { episode } } = item
        const folderPath = name.substring(0, name.lastIndexOf("\\"))
        const episodeNumber = Number(episode) // Convert episode to a number

        if (folderPath in folderToEpisodeRangeMap) {
            folderToEpisodeRangeMap[folderPath].end = Math.max(
                folderToEpisodeRangeMap[folderPath].end,
                episodeNumber,
            )
        } else {
            folderToEpisodeRangeMap[folderPath] = {
                start: episodeNumber,
                end: episodeNumber,
            }
        }
    })

    // Normalize episode numbers within each folder group
    const result: Output[] = []
    array.forEach((item) => {
        const { info: { name }, originalName, parsed: { episode } } = item

        const folderPath = name?.substring(0, name.lastIndexOf("\\"))
        const { start, end } = folderToEpisodeRangeMap[folderPath]

        const folderParsed = folderPath ? rakun.parse(folderPath.split("\\")[folderPath.split("\\").length - 1]) : undefined
        const parsed = rakun.parse(originalName)

        // Unused - Might use this to choose appropriate season
        const season = (!!folderParsed?.season || !!parsed?.season) ? Number(folderParsed?.season || parsed?.season) : undefined

        const episodeNumber = Number(episode) // Convert episode to a number
        const trueEpisode = episodeNumber - start + 1
        result.push({ ...item, trueEpisode, season })
    })

    return result
}
