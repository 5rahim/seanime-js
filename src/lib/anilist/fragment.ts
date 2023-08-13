import gql from "graphql-tag"
import { ShortMediaFragment } from "@/gql/graphql"

export type AnilistMedia = ShortMediaFragment

export const _mediaFragment = gql`
    fragment media on Media {
        siteUrl
        id
        title {
            userPreferred
            romaji
            english
            native
        }
        coverImage {
            extraLarge
            large
            medium
            color
        }
        startDate {
            year
            month
            day
        }
        endDate {
            year
            month
            day
        }
        bannerImage
        season
        description
        type
        format
        status(version: 2)
        episodes
        duration
        chapters
        volumes
        genres
        isAdult
        synonyms
        averageScore
        popularity
        countryOfOrigin
        mediaListEntry {
            id
            status
        }
        nextAiringEpisode {
            airingAt
            timeUntilAiring
            episode
        }
        studios(isMain: true) {
            edges {
                isMain
                node {
                    id
                    name
                }
            }
        }
        relations {
            edges {
                relationType(version: 2)
                node {
                    id
                    title {
                        romaji
                        native
                        english
                    }
                    siteUrl
                }
            }
        }
    }
`

export const _shortMediaFragment = gql`
    fragment shortMedia on Media {
        id
        idMal
        siteUrl
        status(version: 2)
        season
        title {
            userPreferred
            romaji
            english
            native
        }
        coverImage {
            extraLarge
            large
            medium
            color
        }
        trailer {
            id
            site
            thumbnail
        }
        streamingEpisodes {
            title
            thumbnail
            url
            site
        }
        bannerImage
        genres
        isAdult
        episodes
        synonyms
        nextAiringEpisode {
            airingAt
            episode
            timeUntilAiring
        }
        format
        description(asHtml: false)
        source
        studios(isMain: true) {
            nodes {
                name
            }
        }
        countryOfOrigin
        startDate {
            year
            month
            day
        }
    }
`
