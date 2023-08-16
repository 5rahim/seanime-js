"use client"

import { useAtom, useAtomValue } from "jotai/react"
import { getUserAtom, userAtom } from "@/atoms/user"
import { aniListTokenAtom } from "@/atoms/auth"
import { useEffect } from "react"
import { settingsAtoms } from "@/atoms/settings"
import { localFilesAtom, localFilesWithNoMatchAtom } from "@/atoms/library"
import { anilistCollectionAtom, getAnilistCollectionAtom } from "@/atoms/anilist-collection"

export const AtomPreloader = () => {
    const token = useAtomValue(aniListTokenAtom) // Token
    const user = useAtomValue(userAtom) // User
    useAtomValue(settingsAtoms) // Settings - (persistent)
    useAtomValue(localFilesAtom) // Local files - (persistent)
    useAtomValue(localFilesWithNoMatchAtom) // Local files with no match - (persistent)
    // useAtomValue(markedPathsAtom) // Marked paths - (persistent)
    const collection = useAtomValue(anilistCollectionAtom) // Anilist Collection - (persistent)

    const [, getUser] = useAtom(getUserAtom)
    const [, getAnilistCollection] = useAtom(getAnilistCollectionAtom)

    // Refetch when: user or token change, collection is set to undefined
    useEffect(() => {
        (async () => {
            if (collection === undefined) {
                await getAnilistCollection()
            }
        })()
    }, [collection, getAnilistCollection, user, token])

    useEffect(() => {
        (async () => {
            await getUser()
        })()
    }, [getUser, token])

    return null
}
