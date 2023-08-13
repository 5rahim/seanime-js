"use client"

import { useAtom, useAtomValue } from "jotai/react"
import { getUserAtom } from "@/atoms/user"
import { aniListTokenAtom } from "@/atoms/auth"
import { useEffect } from "react"
import { settingsAtoms } from "@/atoms/settings"

export const AtomPreloader = () => {
    const token = useAtomValue(aniListTokenAtom)
    useAtomValue(settingsAtoms)
    const [, getUser] = useAtom(getUserAtom)

    useEffect(() => {

    }, [])

    useEffect(() => {
        getUser()
    }, [getUser, token])

    return null
}
