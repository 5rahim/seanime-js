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
