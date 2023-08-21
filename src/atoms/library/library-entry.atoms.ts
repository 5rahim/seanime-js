import { Nullish } from "@/types/common"
import { useAtom, useAtomValue } from "jotai/react"
import { allUserMediaAtom, useStoredAnilistCollection } from "@/atoms/anilist-collection"
import { startTransition, useCallback, useEffect, useMemo } from "react"
import _ from "lodash"
import { ANIDB_RX } from "@/lib/series-scanner/regex"
import { useImmerAtom } from "jotai-immer"
import { LibraryEntry } from "@/lib/local-library/library-entry"
import { logger } from "@/lib/helpers/debug"
import { atomWithStorage, selectAtom, splitAtom } from "jotai/utils"
import { localFilesAtom, useStoredLocalFiles } from "@/atoms/library/local-file.atoms"
import { atom, PrimitiveAtom } from "jotai"
import deepEquals from "fast-deep-equal"
import { AnilistSimpleMedia } from "@/lib/anilist/fragment"
import { LocalFile } from "@/lib/local-library/local-file"

/**
 * Store the library entries upon scan
 */
export const libraryEntriesAtom = atomWithStorage<LibraryEntry[]>("sea-library-entries", [], undefined, { unstable_getOnInit: true })

export function useLibraryCleanup() {
    const [, setEntries] = useImmerAtom(libraryEntriesAtom)
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

export function useLibraryEntries() {

    const [entries, setEntries] = useImmerAtom(libraryEntriesAtom)

    return {
        entries: entries,
        setEntries,
        /**
         * Will only add entries that do not exist
         */
        actualizeEntries: (incomingEntries: LibraryEntry[]) => {
            startTransition(() => {
                setEntries(entries => {
                    logger("atom/library/actualizeEntries").info("Scanned entries ", incomingEntries.length)
                    const entriesMediaIds = new Set(entries.map(entry => entry.media.id))

                    for (const incomingEntry of incomingEntries) {
                        if (!entriesMediaIds.has(incomingEntry.media.id)) {
                            entries.push(incomingEntry)
                        }
                    }
                    return
                })
            })
        },

    }

}

export function useLibraryEntry(mediaId: Nullish<number>) {

    const entries = useAtomValue(libraryEntriesAtom)
    const { getMediaFiles } = useStoredLocalFiles()

    const { collection, getMediaListEntry } = useStoredAnilistCollection()

    const mediaListEntry = useMemo(() => mediaId ? getMediaListEntry(mediaId) : undefined, [collection, mediaId])

    const entry = useMemo(() => {
        return entries.find(entry => entry.media.id === mediaId)
    }, [entries])

    const mainFiles = useMemo(() => {
        const files = getMediaFiles(entry?.media.id)
        return _.sortBy(files, n => Number(n.parsedInfo?.episode)).filter(file => !ANIDB_RX[0].test(file.path) &&
            !ANIDB_RX[1].test(file.path) &&
            !ANIDB_RX[2].test(file.path) &&
            !ANIDB_RX[4].test(file.path) &&
            !ANIDB_RX[5].test(file.path) &&
            !ANIDB_RX[6].test(file.path),
        ) ?? []
    }, [entry])

    const ovaFiles = useMemo(() => {
        const files = getMediaFiles(entry?.media.id)
        return _.sortBy(files, n => Number(n.parsedInfo?.episode)).filter(file => (ANIDB_RX[0].test(file.path) ||
            ANIDB_RX[5].test(file.path) ||
            ANIDB_RX[6].test(file.path)) && !(ANIDB_RX[1].test(file.path) ||
            ANIDB_RX[2].test(file.path) ||
            ANIDB_RX[3].test(file.path) ||
            ANIDB_RX[4].test(file.path)),
        ) ?? []
    }, [entry])

    const ncFiles = useMemo(() => {
        const files = getMediaFiles(entry?.media.id)
        return _.sortBy(files, n => Number(n.parsedInfo?.episode)).filter(file => ANIDB_RX[1].test(file.path) ||
            ANIDB_RX[2].test(file.path) ||
            ANIDB_RX[3].test(file.path) ||
            ANIDB_RX[4].test(file.path),
        ) ?? []
    }, [entry])

    const watchOrderFiles = useMemo(() => {
        const files = getMediaFiles(entry?.media.id)
        if (!!mainFiles && !!mediaListEntry?.progress && !!mediaListEntry.media?.episodes && files.length > 0 && !(mediaListEntry.progress === Number(mediaListEntry.media.episodes))) {

            return {
                toWatch: mainFiles?.slice(mediaListEntry.progress) ?? [],
                watched: mainFiles?.slice(0, mediaListEntry.progress) ?? [],
            }
        }
        return {
            toWatch: mainFiles ?? [],
            watched: [],
        }
    }, [entry, mediaListEntry])

    return {
        entry: entry,
        mainFiles,
        watchOrderFiles,
        ncFiles,
        ovaFiles,
    }

}

/* -------------------------------------------------------------------------------------------------
 * LibraryEntry
 * -----------------------------------------------------------------------------------------------*/

export type unstable_LibraryEntry = {
    id: number // Media ID
    media: AnilistSimpleMedia,
    files: LocalFile[]
}
export const unstable_libraryEntriesAtom = atom(get => {
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
            }
        }
    }).filter(Boolean).filter(entry => entry.files.length > 0) as unstable_LibraryEntry[]
})

/* -------------------------------------------------------------------------------------------------
 * Read
 * -----------------------------------------------------------------------------------------------*/

export const libraryEntryAtoms = splitAtom(unstable_libraryEntriesAtom)

export const getLibraryEntryAtomsByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => get(libraryEntryAtoms).filter((fileAtom) => get(fileAtom).id === mediaId),
)

/**
 * Useful for mapping over [LibraryEntry]s
 * @example Parent
 * const libraryEntryAtoms = useLocalFileAtomsByMediaId(props.mediaId)
 *  ...
 * libraryEntryAtoms.map(entryAtom => <Child key={`${entryAtom}`} entryAtom={entryAtom}/>
 *
 * @example Children
 * const entry = useAtomValue(entryAtom)
 */
export const useLibraryEntryAtomByMediaId = (mediaId: number) => {
    const [, get] = useAtom(getLibraryEntryAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), []) as Array<PrimitiveAtom<unstable_LibraryEntry>>
}

export const useLibraryEntryAtoms = () => {
    const value = useAtomValue(libraryEntryAtoms)
    return useMemo(() => value, []) as Array<PrimitiveAtom<unstable_LibraryEntry>>
}

/**
 * @example
 * const entry = useLibraryEntryByMediaId(21)
 */
export const useLibraryEntryByMediaId = (mediaId: number): unstable_LibraryEntry | undefined => {
    return useAtomValue(
        selectAtom(
            unstable_libraryEntriesAtom,
            useCallback(entries => entries.find(entry => entry.media.id === mediaId), []), // Stable reference
            deepEquals, // Equality check
        ),
    )
}
