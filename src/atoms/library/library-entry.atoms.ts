import { Nullish } from "@/types/common"
import { useAtomValue } from "jotai/react"
import { useStoredAnilistCollection } from "@/atoms/anilist-collection"
import { startTransition, useEffect, useMemo } from "react"
import _ from "lodash"
import { ANIDB_RX } from "@/lib/series-scanner/regex"
import { useImmerAtom } from "jotai-immer"
import { LibraryEntry } from "@/lib/local-library/library-entry"
import { logger } from "@/lib/helpers/debug"
import { atomWithStorage } from "jotai/utils"
import { localFilesAtom, useStoredLocalFiles } from "@/atoms/library/local-file.atoms"

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
