import { ConsumetAnimeEpisode } from "@/lib/consumet/types"

export function getConsumetEpisodeDataByNumber(episodes: ConsumetAnimeEpisode[], episodeNumber: number) {
    return episodes.find(episode => episode.number === episodeNumber)
}
