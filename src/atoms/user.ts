import { atom } from "jotai"
import { ViewerDocument, ViewerQuery } from "@/gql/graphql"
import { aniListTokenAtom } from "@/atoms/auth"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { useAtomValue } from "jotai/react"

export type User = Required<ViewerQuery["Viewer"]>

export const userAtom = atom<User | undefined | null>(undefined)

export const getUserAtom = atom(null, async (get, set) => {
    try {
        const token = get(aniListTokenAtom)
        if (token) {
            const res = await useAniListAsyncQuery(ViewerDocument, undefined, token)
            if (res.Viewer) {
                set(userAtom, res.Viewer as User)
            }
        } else {
            set(userAtom, null)
        }
    } catch (e) {
        set(userAtom, null)
        set(aniListTokenAtom, undefined)
    }
})


export function useCurrentUser() {

    const user = useAtomValue(userAtom)

    return {
        user,
    }

}
