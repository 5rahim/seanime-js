import { GraphQLClient } from "graphql-request"
import { ANILIST_API_ENDPOINT } from "@/lib/anilist/config"
import { Nullish } from "@/types/common"
import React, { useEffect } from "react"
import { useAuthed } from "@/atoms/auth"

export const getGraphQLClient = (accessToken?: Nullish<string>, role?: string) => {

    return new GraphQLClient(ANILIST_API_ENDPOINT, {
        // @ts-ignore
        headers: accessToken ? {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
        } : {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        cache: "no-cache",
    })
}

/* -------------------------------------------------------------------------------------------------
 * Provider
 * -----------------------------------------------------------------------------------------------*/

export const __AniListGraphQLClientContext = React.createContext<GraphQLClient>(new GraphQLClient(""))

export function AniListGraphQLClientProvider({ children }: { children: React.ReactNode }) {

    const { token } = useAuthed()

    const [graphQLClient, setGraphQLClient] = React.useState(getGraphQLClient(token))

    useEffect(() => {
        setGraphQLClient(getGraphQLClient(token))
    }, [token])

    return <__AniListGraphQLClientContext.Provider value={graphQLClient}>
        {children}
    </__AniListGraphQLClientContext.Provider>
}

export const useAniListGraphQLClient = () => React.useContext(__AniListGraphQLClientContext)
