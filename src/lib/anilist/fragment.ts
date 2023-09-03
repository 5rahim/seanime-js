import gql from "graphql-tag"
import { MediaFragment, ShortMediaFragment, ShowcaseMediaFragment } from "@/gql/graphql"

export type AnilistShortMedia = ShortMediaFragment
export type AnilistShowcaseMedia = ShowcaseMediaFragment
export type AnilistDetailedMedia = MediaFragment

export const _mediaFragment = gql`
    fragment media on Media {
        siteUrl
        id
        idMal
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
            nodes {
                name
            }
        }
        relations {
            edges {
                relationType(version: 2)
                node {
                    ...showcaseMedia
                }
            }
        }
        meanScore
        rankings {
            context
            type
            rank
            year
            format
            allTime
            season
        }
        genres
        studios(isMain: true) {
            edges {
                id
                node {
                    name
                    isAnimationStudio
                }
            }
        }
        recommendations(page: 1, perPage: 8, sort: RATING_DESC) {
            edges {
                node {
                    mediaRecommendation {
                        id
                        coverImage {
                            extraLarge
                            large
                            medium
                            color
                        }
                        bannerImage
                        title {
                            romaji
                            english
                            native
                            userPreferred
                        }
                    }
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
        type
        format
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
        relations {
            edges {
                relationType(version: 2)
                node {
                    ...showcaseMedia
                }
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


export const _shortMediaWithoutRelationsFragment = gql`
    fragment showcaseMedia on Media {
        id
        idMal
        siteUrl
        status(version: 2)
        season
        type
        format
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
        bannerImage
        episodes
        synonyms
        startDate {
            year
            month
            day
        }
        nextAiringEpisode {
            airingAt
            timeUntilAiring
            episode
        }
    }
`
