"use client"

import { useAtom, useAtomValue } from "jotai/react"
import { getUserAtom } from "@/atoms/user"
import { aniListTokenAtom } from "@/atoms/auth"
import { useEffect } from "react"

export const AtomPreloader = () => {
    const token = useAtomValue(aniListTokenAtom)
    const [, getUser] = useAtom(getUserAtom)

    useEffect(() => {
        getUser()
    }, [getUser, token])

    return null
}
