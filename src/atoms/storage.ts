"use client"

import { useAtom, useAtomValue } from "jotai/react"
import { getUserAtom } from "@/atoms/user"
import { anilistClientTokenAtom } from "@/atoms/auth"
import { useEffect } from "react"
import { settingsAtoms } from "@/atoms/settings"
import { localFilesAtom } from "@/atoms/library/local-file.atoms"

export const AtomPreloader = () => {
    const token = useAtomValue(anilistClientTokenAtom) // Token
    useAtomValue(settingsAtoms) // Settings - (persistent)
    useAtomValue(localFilesAtom) // Local files
    // const collection = useAtomValue(anilistCollectionAtom) // Anilist Collection - (persistent)

    const [, getUser] = useAtom(getUserAtom)

    useEffect(() => {
        (async () => {
            await getUser()
        })()
    }, [getUser, token])

    return null
}
