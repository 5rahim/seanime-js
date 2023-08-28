"use server"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { UpdateEntryDocument, UpdateEntryMutationVariables } from "@/gql/graphql"
import { logger } from "@/lib/helpers/debug"

export async function updateEntry(variables: UpdateEntryMutationVariables, token: string | null | undefined) {
    try {
        if (token) {
            const mutation = await useAniListAsyncQuery(UpdateEntryDocument, {
                ...variables,
            }, token)
            return true
        }
    } catch (e) {
        logger("anilist/updateEntry").error("Could not update entry")
        logger("anilist/updateEntry").error(e)
        return false
    }
}
