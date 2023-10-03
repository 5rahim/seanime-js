export type AnifyAnimeContentMetadata = {
    providerId: string
    episodes: Episode[]
}[]

export type AnifyAnimeEpisodeData = {
    id: string
    number: number
    title: string
    isFiller: boolean
    img: string | null
    hasDub: boolean
    updatedAt: number
}
