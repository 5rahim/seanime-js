"use server"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { UpdateEntryDocument, UpdateEntryMutationVariables } from "@/gql/graphql"
import { logger } from "@/lib/helpers/debug"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"

export async function updateEntry(variables: UpdateEntryMutationVariables, token: string | null | undefined) {
    try {
        if (token) {
            const mutation = await useAniListAsyncQuery(UpdateEntryDocument, {
                ...variables,
            }, token)
        }
    } catch (e) {
        logger("anilist/updateEntry").error("Could not update entry")
    }
}

export async function watchedEntry(props: {
    media: AnilistShowcaseMedia,
    episode: number,
    token: string | null | undefined
}) {
    try {
        if (props.media && props.episode && props.token) {
            const mutation = await useAniListAsyncQuery(UpdateEntryDocument, {
                mediaId: props.media.id,
                progress: props.episode,
                status: props.episode === 1 && props.media.episodes !== 1 ? "CURRENT" : undefined, //MediaListStatus
            }, props.token)
        }
    } catch (e) {
        logger("anilist/watchedEntry").error("Could not update entry")
    }
}
