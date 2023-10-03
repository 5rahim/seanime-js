"use client"

import { useAtom, useAtomValue } from "jotai/react"
import { getUserAtom } from "@/atoms/user"
import { anilistClientTokenAtom, useHydrateAnilistToken } from "@/atoms/auth"
import { useEffect } from "react"

export const AtomPreloader = (props: {
    anilistToken: string | null | undefined
}) => {
    const token = useAtomValue(anilistClientTokenAtom) // Token

    const [, getUser] = useAtom(getUserAtom)

    useHydrateAnilistToken(props.anilistToken)

    useEffect(() => {
        (async () => {
            await getUser()
        })()
    }, [getUser, token])

    return null
}
