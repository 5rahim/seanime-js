type TitleTranslations = {
    [key: string]: string
}

type Episode = {
    tvdbEid: number
    airdate: string
    seasonNumber: number
    episodeNumber: number
    title: TitleTranslations
    image: string
    length: number
    episode: string
    anidbEid: number
    rating: string
}

type Episodes = {
    [episodeNumber: string]: Episode
}

type Mappings = {
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

type AniZipData = {
    titles: TitleTranslations
    episodes: Episodes
    episodeCount: number
    specialCount: number
    mappings: Mappings
}
