"use client"

import { useAtom, useAtomValue } from "jotai/react"
import { getUserAtom } from "@/atoms/user"
import { anilistClientTokenAtom, useHydrateAnilistToken } from "@/atoms/auth"
import { useEffect } from "react"
import { settingsAtoms } from "@/atoms/settings"
import { localFilesAtom } from "@/atoms/library/local-file.atoms"

export const AtomPreloader = (props: {
    anilistToken: string | null | undefined
}) => {
    // useHydrateAtoms([
    //     [anilistClientTokenAtom, props.anilistToken]
    // ])
    const token = useAtomValue(anilistClientTokenAtom) // Token
    useAtomValue(settingsAtoms) // Settings - (persistent)
    useAtomValue(localFilesAtom) // Local files
    // const collection = useAtomValue(anilistCollectionAtom) // Anilist Collection - (persistent)

    const [, getUser] = useAtom(getUserAtom)

    useHydrateAnilistToken(props.anilistToken)

    useEffect(() => {
        (async () => {
            await getUser()
        })()
    }, [getUser, token])

    return null
}
