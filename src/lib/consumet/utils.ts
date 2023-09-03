import { ConsumetAnimeEpisodeMeta } from "@/lib/consumet/types"

export function getConsumetEpisodeDataByNumber(episodeNumber: number, episodes: ConsumetAnimeEpisodeMeta[]) {
    return episodes.find(episode => episode.number === episodeNumber)
}
