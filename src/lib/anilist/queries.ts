import gql from "graphql-tag"

export const _Viewer = gql`
    query Viewer {
        Viewer {
            name
            avatar {
                large
                medium
            }
            bannerImage
            isBlocked
            options {
                displayAdultContent
                airingNotifications
                profileColor
            }
        }
    }
`

export const _AnimeCollection = gql`
    query AnimeCollection ($userName: String) {
        MediaListCollection(userName: $userName, type: ANIME) {
            lists {
                entries {
                    id
                    score
                    progress
                    status
                    notes
                    repeat
                    private
                    startedAt {
                        year
                        month
                        day
                    }
                    completedAt {
                        year
                        month
                        day
                    }
                    media {
                        ...shortMedia
                    }
                }
            }
        }
    }
`

export const _SimpleAnimeCollection = gql`
    query SimpleAnimeCollection ($userName: String) {
        MediaListCollection(userName: $userName, type: ANIME) {
            lists {
                entries {
                    id
                    media {
                        ...showcaseMedia
                    }
                }
            }
        }
    }
`

export const _SearchAnimeShortMedia = gql`
    query SearchAnimeShortMedia($page: Int, $perPage: Int, $sort: [MediaSort], $search: String, $status: [MediaStatus]){
        Page(page: $page, perPage: $perPage){
            pageInfo{
                hasNextPage
            },
            media(type: ANIME, search: $search, sort: $sort, status_in: $status, isAdult: false, format_not: MUSIC){
                ...shortMedia
            }
        }
    }
`

export const _ListAnime = gql`
    query ListAnime($page: Int, $search: String, $perPage: Int, $sort: [MediaSort], $status: [MediaStatus], $genres: [String], $averageScore_greater: Int, $season: MediaSeason, $seasonYear: Int, $format: MediaFormat){
        Page(page: $page, perPage: $perPage){
            pageInfo{
                hasNextPage
                total
                perPage
                currentPage
                lastPage
            },
            media(type: ANIME, search: $search, sort: $sort, status_in: $status, isAdult: false, format: $format, genre_in: $genres, averageScore_greater: $averageScore_greater, season: $season, seasonYear: $seasonYear, format_not: MUSIC){
                ...shortMedia
            }
        }
    }
`

export const _ListRecentAirings = gql`
    query ListRecentAirings($page: Int, $perPage: Int, $airingAt_greater: Int, $airingAt_lesser: Int){
        Page(page: $page, perPage: $perPage){
            pageInfo{
                hasNextPage
                total
                perPage
                currentPage
                lastPage
            },
            airingSchedules(notYetAired: false, sort: TIME_DESC, airingAt_greater: $airingAt_greater, airingAt_lesser: $airingAt_lesser){
                id
                airingAt
                episode
                timeUntilAiring
                media {
                    isAdult
                    ...shortMedia
                }
            }
        }
    }
`


export const _AnimeByMalId = gql`
    query AnimeByMalId ($id: Int) {
        Media(idMal: $id, type: ANIME) {
            ...showcaseMedia
        }
    }
`

export const _AnimeById = gql`
    query AnimeById ($id: Int) {
        Media(id: $id, type: ANIME) {
            ...media
        }
    }
`
export const _AnimeShortMediaById = gql`
    query AnimeShortMediaById ($id: Int) {
        Media(id: $id, type: ANIME) {
            ...shortMedia
        }
    }
`


export const _SaveOrUpdateEntry = gql`
    mutation UpdateEntry (
        $mediaId: Int
        $status: MediaListStatus
        $score: Float
        $progress: Int
        $repeat: Int
        $private: Boolean
        $notes: String
        $hiddenFromStatusLists: Boolean
        $startedAt: FuzzyDateInput
        $completedAt: FuzzyDateInput
    ) {
        SaveMediaListEntry(
            mediaId: $mediaId
            status: $status
            score: $score
            progress: $progress
            repeat: $repeat
            private: $private
            notes: $notes
            hiddenFromStatusLists: $hiddenFromStatusLists
            startedAt: $startedAt
            completedAt: $completedAt
        ) {
            id
        }
    }
`


export const _DeleteEntry = gql`
    mutation DeleteEntry (
        $mediaListEntryId: Int
    ) {
        DeleteMediaListEntry(
            id: $mediaListEntryId
        ) {
            deleted
        }
    }
`
