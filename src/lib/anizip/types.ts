type AniZipTitleTranslations = {
    [key: string]: string
}

type AniZipEpisode = {
    tvdbEid: number
    airdate: string
    seasonNumber: number
    episodeNumber: number
    absoluteEpisodeNumber: number
    title: AniZipTitleTranslations
    image: string
    summary?: string
    overview?: string
    runtime?: number
    length?: number
    episode: string
    anidbEid: number
    rating: string
}

type AniZipEpisodes = {
    [episodeNumber: string]: AniZipEpisode
}

type AniZipMappings = {
    animeplanet_id: string
    kitsu_id: number
    mal_id: number
    type: string
    anilist_id: number
    anisearch_id: number
    anidb_id: number
    notifymoe_id: string
    livechart_id: number
    thetvdb_id: number
    imdb_id: string | null
    themoviedb_id: string | null
}

export type AniZipData = {
    titles: AniZipTitleTranslations
    episodes: AniZipEpisodes
    episodeCount: number
    specialCount: number
    mappings: AniZipMappings
}
