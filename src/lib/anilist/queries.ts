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
                    media {
                        ...showcaseMedia
                    }
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
