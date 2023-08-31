import { GraphQLClient } from "graphql-request"
import { ANILIST_API_ENDPOINT } from "@/lib/anilist/config"
import { Nullish } from "@/types/common"

export const getAniListGraphQLClient = (accessToken?: Nullish<string>, role?: string) => {

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
        method: "POST",
    })
}
