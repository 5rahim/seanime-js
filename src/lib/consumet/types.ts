export type ConsumetAnimeMeta = {
    episodes: ConsumetAnimeEpisode[]
} // TODO Rest

export type ConsumetAnimeEpisode = {
    id: string
    title: string | null | undefined
    description: string | null | undefined
    number: number
    image: string | null | undefined
    airDate: string | null | undefined
}

export type ConsumetAnimeEpisodeData = ConsumetAnimeEpisode[] | null

export type ConsumetStreamingProviderData = {
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
export type ConsumetProvider =
    "9anime"
    | "animefox"
    | "animepahe"
    | "bilibili"
    | "crunchyroll"
    | "enime"
    | "gogoanime"
    | "marin"
    | "zoro"

export type ZoroServer = "vidcloud" | "streamsb" | "vidstreaming" | "streamtape"
export type GogoAnimeServer = "gogocdn" | "streamsb" | "vidstreaming"

// export const consumetZoroServers = ["vidcloud", "streamsb", "vidstreaming", "streamtape"]
export const consumetZoroServers = ["vidstreaming"]

// export const consumetGogoAnimeServers = ["gogocdn", "streamsb", "vidstreaming"]
export const consumetGogoAnimeServers = ["gogocdn", "vidstreaming"]
