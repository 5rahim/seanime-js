import React, { useEffect } from "react"
import { useAuthed } from "@/atoms/auth"
import { getAniListGraphQLClient } from "@/lib/anilist/graphql-client"
import { GraphQLClient } from "graphql-request"

export const __AniListGraphQLClientContext = React.createContext<GraphQLClient>(new GraphQLClient(""))

export function AniListGraphQLClientProvider({ children }: { children: React.ReactNode }) {

    const { token } = useAuthed()

    const [graphQLClient, setGraphQLClient] = React.useState(getAniListGraphQLClient(token))

    useEffect(() => {
        setGraphQLClient(getAniListGraphQLClient(token))
    }, [token])

    return <__AniListGraphQLClientContext.Provider value={graphQLClient}>
        {children}
    </__AniListGraphQLClientContext.Provider>
}

export const useAniListGraphQLClient = () => React.useContext(__AniListGraphQLClientContext)
