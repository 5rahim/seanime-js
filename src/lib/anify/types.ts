export type AnifyAnimeEpisode = {
    id: string
    number: number
    title: string
    isFiller: boolean
    img: string | null
    hasDub: boolean
    updatedAt: number
}

export type AnifyAnimeEpisodeData = {
    providerId: string
    episodes: Episode[]
}[]
