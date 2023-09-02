export type ConsumetAnimeMeta = {
    episodes: ConsumetAnimeEpisode[]
} // TODO

export type ConsumetAnimeEpisode = {
    id: string
    title: string | null | undefined
    description: string | null | undefined
    number: number
    image: string | null | undefined
    airDate: string | null | undefined
}

export type ConsumetStreamingData = {
    headers: {
        Referer: string
        watchsb?: string | null
        "User-Agent"?: string | null
    }
    sources: {
        url: string
        isM3U8: boolean
        quality: string
    }[]
    subtitles?: {
        lang: string,
        url: string
    }[]
}

export type ConsumetErrorResponse = { message: string }
