import { atomWithStorage } from "jotai/utils"
import { LocalFile } from "@/lib/local-library/local-file"
import { useAtom, useAtomValue } from "jotai/react"
import { LibraryEntry } from "@/lib/local-library/library-entry"
import { atom } from "jotai"
import { logger } from "@/lib/helpers/debug"
import _ from "lodash"
import { fetchMALRecommendations } from "@/lib/mal/fetch-recommendations"
import { Nullish } from "@/types/common"
import { startTransition, useCallback, useEffect, useMemo } from "react"
import { useStoredAnilistCollection } from "@/atoms/anilist-collection"
import { useImmerAtom } from "jotai-immer"

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

    const sortedFiles = useMemo(() => {
        const files = getMediaFiles(entry?.media.id)
        return _.sortBy(files, n => Number(n.parsedInfo?.episode)) ?? []
    }, [entry])

    const watchOrderFiles = useMemo(() => {
        const files = getMediaFiles(entry?.media.id)
        if (!!sortedFiles && !!mediaListEntry?.progress && !!mediaListEntry.media?.episodes && files.length > 0 && !(mediaListEntry.progress === Number(mediaListEntry.media.episodes))) {

            return {
                toWatch: sortedFiles?.slice(mediaListEntry.progress) ?? [],
                watched: sortedFiles?.slice(0, mediaListEntry.progress) ?? [],
            }
        }
        return {
            toWatch: sortedFiles ?? [],
            watched: [],
        }
    }, [entry, mediaListEntry])

    return {
        entry: entry,
        sortedFiles,
        watchOrderFiles,
    }

}


/* -------------------------------------------------------------------------------------------------
 * Local files with no match
 * -----------------------------------------------------------------------------------------------*/

export type MatchingRecommendationGroup = {
    files: LocalFile[],
    folderPath: string,
    recommendations: any // From MAL
}
export const libraryMatchingRecommendationGroupsAtom = atomWithStorage<MatchingRecommendationGroup[]>("sea-library-matching-recommendation-groups", [])

const _matchingRecommendationIsLoading = atom(false)

const getRecommendationPerGroupAtom = atom(null, async (get, set) => {
    try {
        // Find only files that are not ignored
        const files = get(localFilesAtom).filter(file => file.mediaId === null && !file.ignored)

        logger("atom/library/getRecommendationPerGroupAtom").info(files.length)

        if (files.length > 0) {
            set(libraryMatchingRecommendationGroupsAtom, [])
            //
            logger("atom/library/getRecommendationPerGroupAtom").info("Grouping local files with no media")
            set(_matchingRecommendationIsLoading, true)
            //
            const filesWithFolderPath = files.map(file => {
                return ({ ...file, folderPath: file.path.replace("\\" + file.name, "") })
            }) as (LocalFile & { folderPath: string })[]

            logger("atom/library/getRecommendationPerGroupAtom").info("filesWithFolderPath", filesWithFolderPath)

            const groupedByCommonParentName = _.groupBy(filesWithFolderPath, n => n.folderPath)


            let groups: MatchingRecommendationGroup[] = []
            //
            logger("atom/library/getRecommendationPerGroupAtom").info("Fetching recommendation for each group")
            //
            for (let i = 0; i < Object.keys(groupedByCommonParentName).length; i++) {
                const commonPath = Object.keys(groupedByCommonParentName)[i]
                const lFiles = filesWithFolderPath.filter(file => file.folderPath === commonPath)
                const _fTitle = lFiles[0]?.parsedFolderInfo.findLast(n => !!n.title)?.title
                const _title = lFiles[0]?.parsedInfo?.title
                try {
                    if (_fTitle || _title) {
                        const animeList1 = _title ? (await fetchMALRecommendations(_title)) : []
                        const animeList2 = _fTitle ? (await fetchMALRecommendations(_fTitle)) : []

                        if (animeList1) {
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
            set(_matchingRecommendationIsLoading, false)
            logger("atom/library").info("Matching recommendation groups", groups)
            set(libraryMatchingRecommendationGroupsAtom, groups)


        } else {
            set(libraryMatchingRecommendationGroupsAtom, [])
        }
    } catch (e) {
    }
})

export const useMatchingRecommendation = () => {
    const groups = useAtomValue(libraryMatchingRecommendationGroupsAtom)
    const [, getRecommendations] = useAtom(getRecommendationPerGroupAtom)
    const isLoading = useAtomValue(_matchingRecommendationIsLoading)

    return {
        getRecommendations,
        groups,
        isLoading,
    }
}

/* -------------------------------------------------------------------------------------------------
 * Current viewing media
 * -----------------------------------------------------------------------------------------------*/
