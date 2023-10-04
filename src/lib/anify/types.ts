export type AnifyAnimeContentMetadata = {
    providerId: string
    episodes: AnifyAnimeEpisode[]
}[]

export type AnifyAnimeEpisode = {
    id: string
    number: number
    title: string
    isFiller: boolean
    img: string | null
    hasDub: boolean
    updatedAt: number
}
