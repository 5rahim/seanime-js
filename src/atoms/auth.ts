import { atomWithStorage } from "jotai/utils"
import { useAtomValue, useSetAtom } from "jotai/react"
import { createTypesafeFormSchema } from "@/components/ui/typesafe-form"

/* -------------------------------------------------------------------------------------------------
 * Schema
 * -----------------------------------------------------------------------------------------------*/

export const loginSchema = createTypesafeFormSchema(({ z }) => z.object({
    token: z.string().nonempty()
}))

/* -------------------------------------------------------------------------------------------------
 *
 * -----------------------------------------------------------------------------------------------*/

export const aniListTokenAtom = atomWithStorage<string | undefined>('sea-anilist-token', undefined)

export function useAuthed() {
    const token = useAtomValue(aniListTokenAtom)

    // useEffect(() => {
    //     console.log(token)
    // }, [token])

    return {
        isAuthed: !!token,
        token: token,
    }
}

export function useAnilistLogin() {

    const setToken = useSetAtom(aniListTokenAtom)

    return {
        authenticate: setToken
    }

}
