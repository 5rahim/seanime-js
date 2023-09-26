import { useAtom, useSetAtom } from "jotai/react"
import { createTypesafeFormSchema } from "@/components/ui/typesafe-form"
import { authenticateUser, getAniListUserToken, logoutUser } from "@/lib/auth/actions"
import { useLayoutEffect } from "react"
import { atom } from "jotai"

/* -------------------------------------------------------------------------------------------------
 * Schema
 * -----------------------------------------------------------------------------------------------*/

export const loginSchema = createTypesafeFormSchema(({ z }) => z.object({
    token: z.string().nonempty(),
}))

/* -------------------------------------------------------------------------------------------------
 *
 * -----------------------------------------------------------------------------------------------*/

// export const anilistClientTokenAtom = atomWithStorage<string | undefined>("sea-anilist-token", undefined, undefined, { unstable_getOnInit: true })

export const anilistClientTokenAtom = atom<string | null | undefined>(null)

export function useAuthed() {
    // const token = useAtomValue(anilistClientTokenAtom)
    // const setToken = useSetAtom(anilistClientTokenAtom)
    const [clientToken, setClientToken] = useAtom(anilistClientTokenAtom)

    useLayoutEffect(() => {
        (async () => {
            const token = await getAniListUserToken()
            setClientToken(token)
        })()
    }, [])

    return {
        isAuthed: !!clientToken,
        token: clientToken,
    }
}

export function useAnilistLogin() {

    const setToken = useSetAtom(anilistClientTokenAtom)

    return {
        authenticate: async (token: string) => {
            await authenticateUser(token)
            setToken(token)
        },
        logout: async () => {
            await logoutUser()
            setToken(undefined)
        },
    }

}
