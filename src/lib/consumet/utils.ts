import { ConsumetAnimeEpisode } from "@/lib/consumet/types"

export function getConsumetEpisodeDataByNumber(episodeNumber: number, episodes: ConsumetAnimeEpisode[]) {
    return episodes.find(episode => episode.number === episodeNumber)
}
