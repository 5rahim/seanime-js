import { useAtom, useSetAtom } from "jotai/react"
import { createTypesafeFormSchema } from "@/components/ui/typesafe-form"
import { authenticateUser, logoutUser } from "@/lib/auth/actions"
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

export function useHydrateAnilistToken(token: string | null | undefined) {
    const setClientToken = useSetAtom(anilistClientTokenAtom)

    useLayoutEffect(() => {
        setClientToken(token)
    }, [])

}

export function useAuthed() {
    const [clientToken, setClientToken] = useAtom(anilistClientTokenAtom)

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
