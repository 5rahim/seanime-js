import { atomWithStorage } from "jotai/utils"
import { LocalFile } from "@/lib/local-library/local-file"
import { useAtom, useAtomValue } from "jotai/react"
import { LibraryEntry } from "@/lib/local-library/library-entry"
import { atom } from "jotai"
import { logger } from "@/lib/helpers/debug"
import _ from "lodash"
import { fetchMALMatchingSuggestions } from "@/lib/mal/fetch-matching-suggestions"
import { Nullish } from "@/types/common"
import { startTransition, useCallback, useEffect, useMemo } from "react"
import { useStoredAnilistCollection } from "@/atoms/anilist-collection"
import { useImmerAtom } from "jotai-immer"
import { ANIDB_RX } from "@/lib/series-scanner/regex"

/* -------------------------------------------------------------------------------------------------
 * Local files
 * -----------------------------------------------------------------------------------------------*/

/**
 * We store the scanned [LocalFile]s from the local directory
 * - We will use the [LocalFile]s stored to organize the library entries
 */
export const localFilesAtom = atomWithStorage<LocalFile[]>("sea-local-files", [], undefined, { unstable_getOnInit: true })

export function useStoredLocalFiles() {

    const files = useAtomValue(localFilesAtom)
    const [, setFiles] = useImmerAtom(localFilesAtom)

    /**
     * Will keep locked and ignored files and insert new ones.
     *
     * Call this function when [refreshing entries]
     * @param files
     */
    const handleStoreLocalFiles = useCallback((incomingFiles: LocalFile[]) => {
        startTransition(() => {
            setFiles(files => {
                logger("atom/library/handleStoreLocalFiles").info("Incoming files", incomingFiles.length)
                const keptFiles = files.filter(file => file.ignored || file.locked)
                const keptFilesPaths = new Set<string>(keptFiles.map(file => file.path))
                return [...keptFiles, ...incomingFiles.filter(file => !keptFilesPaths.has(file.path))]
            })
        })
    }, [])

    const markedFiles = useMemo(() => {
        return {
            ignored: files.filter(file => file.ignored),
            locked: files.filter(file => file.locked),
        }
    }, [files])

    const markedFilePathSets = useMemo(() => {
        return {
            ignored: new Set(markedFiles.ignored.map(file => file.path)),
            locked: new Set(markedFiles.locked.map(file => file.path)),
        }
    }, [markedFiles])

    const getMediaFiles = useCallback((mediaId: Nullish<number>) => {
        return files.filter(file => file.mediaId === mediaId) ?? []
    }, [files])

    /**
     * Lock file
     */
    const handleToggleMediaFileLocking = (mediaId: Nullish<number>) => {
        startTransition(() => {
            setFiles(files => {
                const concernedFiles = files.filter(file => file.mediaId === mediaId) ?? []
                const allFilesAreLocked = concernedFiles.every(n => n.locked)
                for (const file of concernedFiles) {
                    file.locked = !allFilesAreLocked
                }
                return
            })
        })
    }

    const handleToggleFileLocking = (path: string) => {
        startTransition(() => {
            setFiles(files => {
                const index = files.findIndex(file => file.path === path)
                if (index !== -1) files[index].locked = !files[index].locked
                return
            })
        })
    }

    const handleUnignoreFile = (path: string) => {
        startTransition(() => {
            setFiles(files => {
                const index = files.findIndex(file => file.path === path)
                if (index !== -1) files[index].ignored = false
                return
            })
        })
    }

    /**
     * Un-match file
     */
    const handleUnmatchFile = (path: string) => {
        startTransition(() => {
            setFiles(files => {
                const index = files.findIndex(file => file.path === path)
                if (index !== -1) {
                    files[index].mediaId = null
                    files[index].locked = false
                }
                return
            })
        })
    }

    return {
        localFiles: files,
        storeLocalFiles: handleStoreLocalFiles,
        setLocalFiles: setFiles,
        getMediaFiles: getMediaFiles,
        markedFiles,
        markedFilePathSets,
        unresolvedFileCount: useMemo(() => files.filter(file => !file.mediaId && !file.ignored).length, [files]),
        toggleFileLocking: handleToggleFileLocking,
        toggleMediaFileLocking: handleToggleMediaFileLocking,
        unmatchFile: handleUnmatchFile,
        unignoreFile: handleUnignoreFile,
    }

}

/* -------------------------------------------------------------------------------------------------
 * Library Entries
 * -----------------------------------------------------------------------------------------------*/

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
    const localFiles = useAtomValue(localFilesAtom)


    return {
        entries: entries,
        setEntries,
        /**
         * Will only add entries that do not exist
         */
        actualizeEntries: (incomingEntries: LibraryEntry[]) => {
            startTransition(() => {
                setEntries(entries => {
                    logger("atom/library/actualizeEntries").info("Incoming entries ", incomingEntries.length)
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
 * Local files with no match
 * -----------------------------------------------------------------------------------------------*/

export type MatchingSuggestionGroups = {
    files: LocalFile[],
    folderPath: string,
    recommendations: any // From MAL
}
export const libraryMatchingSuggestionGroupsAtom = atomWithStorage<MatchingSuggestionGroups[]>("sea-library-matching-recommendation-groups", [])

const _isCurrentlyFetchingSuggestions = atom(false)

const getMatchingSuggestionGroupsAtom = atom(null, async (get, set, payload: "file" | "folder") => {
    try {
        // Get only files with no media that are not ignored
        const files = get(localFilesAtom).filter(file => file.mediaId === null && !file.ignored)

        logger("atom/library/getMatchingSuggestionGroup").info(files.length)

        if (files.length > 0) {
            set(libraryMatchingSuggestionGroupsAtom, []) // Reset suggestions

            logger("atom/library/getMatchingSuggestionGroup").info("Grouping local files with no media")
            set(_isCurrentlyFetchingSuggestions, true)

            /** Grouping **/
            const filesWithFolderPath = files.map(file => {
                if (payload === "folder")
                    return ({ ...file, folderPath: file.path.replace("\\" + file.name, "") }) // <-- Group by folder path (file by file)
                else
                    return ({ ...file, folderPath: file.path }) // <--- Group by file path (folder by folder)
            }) as (LocalFile & { folderPath: string })[]
            const groupedByCommonParentName = _.groupBy(filesWithFolderPath, n => n.folderPath)

            /** Final groups **/
            let groups: MatchingSuggestionGroups[] = []
            //
            logger("atom/library/getMatchingSuggestionGroup").info("Fetching suggestions for each group")
            //
            // For performance reasons, store title that we've already fetched suggestions for
            const fetchedSuggestionMap = new Map()
            //
            for (let i = 0; i < Object.keys(groupedByCommonParentName).length; i++) {
                const commonPath = Object.keys(groupedByCommonParentName)[i]
                const lFiles = filesWithFolderPath.filter(file => file.folderPath === commonPath)
                const _fTitle = lFiles[0]?.parsedFolderInfo.findLast(n => !!n.title)?.title
                const _title = lFiles[0]?.parsedInfo?.title
                try {
                    if ((_fTitle || _title)) {
                        let animeList1: any[] = []
                        let animeList2: any[] = []
                        // title
                        if (_title && !fetchedSuggestionMap.has(_title)) {
                            const res = await fetchMALMatchingSuggestions(_title)
                            if (res && res.length > 0) {
                                animeList1 = res
                                fetchedSuggestionMap.set(_title, res)
                            }
                        } else if (_title) {
                            animeList1 = fetchedSuggestionMap.get(_title)
                        }
                        // folder title
                        if (_fTitle && !fetchedSuggestionMap.has(_fTitle)) {
                            const res = await fetchMALMatchingSuggestions(_fTitle)
                            if (res && res.length > 0) {
                                animeList1 = res
                                fetchedSuggestionMap.set(_fTitle, res)
                            }
                        } else if (_fTitle) {
                            animeList1 = fetchedSuggestionMap.get(_fTitle)
                        }

                        if (animeList1.length > 0 || animeList2.length > 0) {
                            groups = [...groups, {
                                files: lFiles,
                                folderPath: commonPath,
                                recommendations: _.uniqBy([...animeList1, ...animeList2], "id"),
                            }]
                        }
                    }
                } catch (e) {
                    logger("atom/library").error(e)
                }
            }
            set(_isCurrentlyFetchingSuggestions, false)
            logger("atom/library").info("Matching suggestion groups", groups)
            set(libraryMatchingSuggestionGroupsAtom, groups)


        } else {
            set(libraryMatchingSuggestionGroupsAtom, [])
        }
    } catch (e) {
    }
})

export const useMatchingSuggestions = () => {
    const groups = useAtomValue(libraryMatchingSuggestionGroupsAtom)
    const [, getMatchingSuggestions] = useAtom(getMatchingSuggestionGroupsAtom)
    const isLoading = useAtomValue(_isCurrentlyFetchingSuggestions)

    return {
        getMatchingSuggestions,
        groups,
        isLoading,
    }
}

/* -------------------------------------------------------------------------------------------------
 * Current viewing media
 * -----------------------------------------------------------------------------------------------*/
