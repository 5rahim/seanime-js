import { AnifyAnimeEpisodeData } from "@/lib/anify/types"
import { Nullish } from "@/types/common"

export function anify_getEpisode(data: Nullish<AnifyAnimeEpisodeData[]>, episode: number | string) {
    return data?.find(n => n.number === Number(episode))
}

export function anify_getEpisodeCover(data: Nullish<AnifyAnimeEpisodeData[]>, episode: number | string) {
    const ep = data?.find(n => n.number === Number(episode))
    return ep?.img
}
