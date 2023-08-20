"use client"

import { useAtom, useAtomValue } from "jotai/react"
import { getUserAtom, userAtom } from "@/atoms/user"
import { aniListTokenAtom } from "@/atoms/auth"
import { useEffect } from "react"
import { settingsAtoms } from "@/atoms/settings"
import { libraryEntriesAtom, useLibraryCleanup } from "@/atoms/library/library-entry.atoms"
import { localFilesAtom } from "@/atoms/library/local-file.atoms"

export const AtomPreloader = () => {
    const token = useAtomValue(aniListTokenAtom) // Token
    const user = useAtomValue(userAtom) // User
    useAtomValue(settingsAtoms) // Settings - (persistent)
    useAtomValue(localFilesAtom) // Local files
    useAtomValue(libraryEntriesAtom) // Library entries
    // const collection = useAtomValue(anilistCollectionAtom) // Anilist Collection - (persistent)

    const [, getUser] = useAtom(getUserAtom)

    useLibraryCleanup()

    useEffect(() => {
        (async () => {
            await getUser()
        })()
    }, [getUser, token])

    return null
}
