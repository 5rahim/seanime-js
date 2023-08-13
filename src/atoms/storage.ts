"use client"

import { useAtom, useAtomValue } from "jotai/react"
import { getUserAtom } from "@/atoms/user"
import { aniListTokenAtom } from "@/atoms/auth"
import { useEffect } from "react"
import { settingsAtoms } from "@/atoms/settings"
import { localFilesAtom } from "@/atoms/library"

export const AtomPreloader = () => {
    const token = useAtomValue(aniListTokenAtom)
    useAtomValue(settingsAtoms)
    useAtomValue(localFilesAtom)
    const [, getUser] = useAtom(getUserAtom)

    // FIXME: When not in dev
    // useEffect(() => {
    //     getAnilistCollection()
    // }, [user])

    useEffect(() => {
        getUser()
    }, [getUser, token])

    return null
}
