type MALSearchResultPayload = {
    media_type: string
    start_year: number
    aired: string
    score: string
    status: string
}

export type MALSearchResultAnime = {
    id: number
    type: string
    name: string
    url: string
    image_url: string
    thumbnail_url: string
    payload: MALSearchResultPayload
    es_score: number
}
