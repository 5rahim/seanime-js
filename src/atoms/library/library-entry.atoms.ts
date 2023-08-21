import { useAtom, useAtomValue } from "jotai/react"
import { allUserMediaAtom } from "@/atoms/anilist-collection"
import { startTransition, useCallback, useEffect, useMemo } from "react"
import { useImmerAtom } from "jotai-immer"
import { Deprecated_LibraryEntry } from "@/lib/local-library/library-entry"
import { logger } from "@/lib/helpers/debug"
import { atomWithStorage, selectAtom, splitAtom } from "jotai/utils"
import { localFilesAtom } from "@/atoms/library/local-file.atoms"
import { atom, PrimitiveAtom } from "jotai"
import deepEquals from "fast-deep-equal"
import { AnilistSimpleMedia } from "@/lib/anilist/fragment"
import { LocalFile } from "@/lib/local-library/local-file"

/**
 * Store the library entries upon scan
 */
export const deprecated_libraryEntriesAtom = atomWithStorage<Deprecated_LibraryEntry[]>("sea-library-entries", [], undefined, { unstable_getOnInit: true })

/**
 * @deprecated
 */
export function legacy_useLibraryCleanup() {
    const [, setEntries] = useImmerAtom(deprecated_libraryEntriesAtom)
    const localFiles = useAtomValue(localFilesAtom)

    /**
     * When localFiles change, update entry's filePaths
     */
    useEffect(() => {
        startTransition(() => {
            setEntries(entries => {
                logger("atom/library/setEntries").info("Update entries files + cleanup")
                for (let i = 0; i < entries.length; i++) {
                    const entryLocalFiles = localFiles.filter(file => file.mediaId === entries[i].media.id)
                    // Actualize an entry file paths
                    entries[i].filePaths = entryLocalFiles.map(file => file.path)

                    if (entries[i].filePaths.length === 0) { // If an entry doesn't have any file path, delete it
                        entries.splice(i, 1)
                    }
                }
                return
            })
        })
    }, [localFiles])
}

/**
 * @deprecated
 */
export function legacy_useLibraryEntries() {

    const [entries, setEntries] = useImmerAtom(deprecated_libraryEntriesAtom)

    return {
        entries: entries,
        setEntries,
        /**
         * Will only add entries that do not exist
         */
        actualizeEntries: (incomingEntries: Deprecated_LibraryEntry[]) => {
            // startTransition(() => {
            //     setEntries(entries => {
            //         logger("atom/library/actualizeEntries").info("Scanned entries ", incomingEntries.length)
            //         const entriesMediaIds = new Set(entries.map(entry => entry.media.id))
            //
            //         for (const incomingEntry of incomingEntries) {
            //             if (!entriesMediaIds.has(incomingEntry.media.id)) {
            //                 entries.push(incomingEntry)
            //             }
            //         }
            //         return
            //     })
            // })
        },

    }

}

/* -------------------------------------------------------------------------------------------------
 * LibraryEntry
 * -----------------------------------------------------------------------------------------------*/

export type LibraryEntry = {
    id: number // Media ID
    media: AnilistSimpleMedia,
    files: LocalFile[]
    sharedPath: string
}
export const libraryEntriesAtom = atom(get => {
    logger("atom/libraryEntriesAtom").warning("Derived")
    // Get all `mediaId`s
    const mediaIds = new Set(get(allUserMediaAtom).map(media => media?.id).filter(Boolean))
    // For each mediaId, create a new [LibraryEntry] from the existing [LocalFile]s
    return [...mediaIds].map(mediaId => {
        const firstFile = get(localFilesAtom).find(file => file.mediaId === mediaId)
        if (firstFile) {
            // Entry
            return {
                id: mediaId,
                media: get(allUserMediaAtom).filter(Boolean).find(media => media.id === mediaId)!,
                files: get(localFilesAtom).filter(file => file.mediaId === mediaId),
                sharedPath: firstFile.path.replace("\\" + firstFile.name, ""),
            } satisfies LibraryEntry
        }
    }).filter(Boolean).filter(entry => entry.files.length > 0) as LibraryEntry[]
})

/* -------------------------------------------------------------------------------------------------
 * Read
 * -----------------------------------------------------------------------------------------------*/

export const libraryEntryAtoms = splitAtom(libraryEntriesAtom, entry => entry.id)

export const getLibraryEntryAtomsByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => get(libraryEntryAtoms).find((fileAtom) => get(fileAtom).id === mediaId),
)

/**
 * Useful for mapping over [LibraryEntry]s
 * @example Parent
 * const libraryEntryAtoms = useLocalFileAtomsByMediaId(21)
 *  ...
 * libraryEntryAtoms.map(entryAtom => <Child key={`${entryAtom}`} entryAtom={entryAtom}/>
 *
 * @example Children
 * const entry = useAtomValue(entryAtom)
 */
export const useLibraryEntryAtomByMediaId = (mediaId: number) => {
    const [, get] = useAtom(getLibraryEntryAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), []) as PrimitiveAtom<LibraryEntry> | undefined
}

export const useLibraryEntryAtoms = () => {
    const value = useAtomValue(libraryEntryAtoms)
    return useMemo(() => value, []) as Array<PrimitiveAtom<LibraryEntry>>
}

/**
 * @example
 * const entries = useLibraryEntries()
 */
export const useLibraryEntries = (): LibraryEntry[] => {
    return useAtomValue(
        selectAtom(
            libraryEntriesAtom,
            useCallback(entries => entries, []), // Stable reference
            deepEquals, // Equality check
        ),
    )
}

/**
 * @example
 * const entry = useLibraryEntryByMediaId(21)
 *
 * const title = entry?.media?.title?.english //=> One Piece
 * const files = entry?.files //=> [{...}, ...]
 */
export const useLibraryEntryByMediaId = (mediaId: number): LibraryEntry | undefined => {
    return useAtomValue(
        selectAtom(
            libraryEntriesAtom,
            useCallback(entries => entries.find(entry => entry.media.id === mediaId), []), // Stable reference
            deepEquals, // Equality check
        ),
    )
}
