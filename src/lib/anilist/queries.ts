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
