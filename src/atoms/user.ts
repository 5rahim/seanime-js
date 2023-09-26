import { atom } from "jotai"
import { ViewerDocument, ViewerQuery } from "@/gql/graphql"
import { anilistClientTokenAtom } from "@/atoms/auth"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { useAtomValue } from "jotai/react"
import { logger } from "@/lib/helpers/debug"
import { atomWithStorage } from "jotai/utils"

export type User = Required<ViewerQuery["Viewer"]>

export const userAtom = atomWithStorage<User | undefined | null>("sea-user", undefined)

export const getUserAtom = atom(null, async (get, set) => {
    try {
        const token = get(anilistClientTokenAtom)
        if (token) {
            logger("atom/user").info("Fetching user")
            const res = await useAniListAsyncQuery(ViewerDocument, undefined, token)
            if (res.Viewer) {
                set(userAtom, res.Viewer as User)
            }
        } else {
            set(userAtom, null)
        }
    } catch (e) {
        set(userAtom, null)
        set(anilistClientTokenAtom, undefined)
    }
})


export function useCurrentUser() {

    const user = useAtomValue(userAtom)

    return {
        user,
    }

}
