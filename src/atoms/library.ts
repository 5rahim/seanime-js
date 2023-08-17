import { atomWithStorage } from "jotai/utils"
import { LocalFile } from "@/lib/local-library/local-file"
import { useAtom, useAtomValue } from "jotai/react"
import { LibraryEntry } from "@/lib/local-library/library-entry"
import { atom } from "jotai"
import { logger } from "@/lib/helpers/debug"
import _ from "lodash"
import { fetchMALRecommendations } from "@/lib/mal/fetch-recommendations"
import { AnilistSimpleMedia } from "@/lib/anilist/fragment"
import { Nullish } from "@/types/common"
import { useMemo } from "react"
import { useStoredAnilistCollection } from "@/atoms/anilist-collection"

/* -------------------------------------------------------------------------------------------------
 * Library Entries
 * -----------------------------------------------------------------------------------------------*/

/**
 * Store the library entries upon scan
 */
export const libraryEntriesAtom = atomWithStorage<LibraryEntry[]>("sea-library-entries", [])

export function useLibraryEntries() {

    const [value, setter] = useAtom(libraryEntriesAtom)

    return {
        entries: value,
        storeLibraryEntries: setter,
    }

}

export function useLibraryEntry(mediaId: Nullish<number>) {

    const [entries, setter] = useAtom(libraryEntriesAtom)

    const { collection, getMediaListEntry } = useStoredAnilistCollection()

    const mediaListEntry = useMemo(() => mediaId ? getMediaListEntry(mediaId) : undefined, [collection, mediaId])

    const entry = useMemo(() => {
        return entries.find(entry => entry.media.id === mediaId)
    }, [entries])

    const sortedFiles = useMemo(() => {
        return _.sortBy(entry?.files, n => Number(n.parsedInfo?.episode)) ?? []
    }, [entry])

    const watchOrderFiles = useMemo(() => {
        // return entry?.files.sort((a, b) => a.parsedInfo?.episode && b.parsedInfo?.episode ? Number(a.parsedInfo?.episode) - Number(b.parsedInfo?.episode) : 0).slice(0, (mediaListEntry?.progress || entry?.files.length)+1)
        // return _.sortBy()
        if (!!sortedFiles && !!mediaListEntry?.progress && !!mediaListEntry.media?.episodes && !!entry?.files && !(mediaListEntry.progress === Number(mediaListEntry.media.episodes))) {

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

    // TODO: Lock file
    // TODO: Un-match file

    return {
        entry: entry,
        sortedFiles,
        watchOrderFiles,
    }

}

/* -------------------------------------------------------------------------------------------------
 * Local files
 * -----------------------------------------------------------------------------------------------*/

/**
 * We store the scanned [LocalFile]s from the local directory
 * - The user should preferably scan the local library once
 * - We will use the [LocalFile]s stored to organize the library entries
 */
// export const localFilesAtom = atomWithStorage<LocalFile[]>("sea-local-files", [])
//
// export function useStoredLocalFiles() {
//
//     const [value, setter] = useAtom(localFilesAtom)
//
//     return {
//         localFiles: value,
//         storeLocalFiles: setter,
//     }
//
// }


/* -------------------------------------------------------------------------------------------------
 * Local files with no match
 * -----------------------------------------------------------------------------------------------*/

export const localFilesWithNoMatchAtom = atomWithStorage<LocalFile[]>("sea-local-files-with-no-match", [])

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
        const files = get(localFilesWithNoMatchAtom).filter(file => !file.ignored)

        if (files.length > 0) {
            set(libraryMatchingRecommendationGroupsAtom, [])
            //
            logger("atom/library").info("Grouping local files with no media")
            set(_matchingRecommendationIsLoading, true)
            //
            const filesWithFolderPath = files.map(file => {
                return _.setWith(file, "folderPath", file.path.replace("\\" + file.name, ""))
            }) as (LocalFile & { folderPath: string })[]

            logger("atom/library").info(filesWithFolderPath)

            const groupedByCommonParentName = _.groupBy(filesWithFolderPath, n => n.folderPath)

            let groups: MatchingRecommendationGroup[] = []
            //
            logger("atom/library").info("Fetching recommendation for each group")
            //
            for (let i = 0; i < Object.keys(groupedByCommonParentName).length; i++) {
                const commonPath = Object.keys(groupedByCommonParentName)[i]
                const lFiles = filesWithFolderPath.filter(file => file.folderPath === commonPath)
                const _fTitle = lFiles[0]?.parsedFolders.findLast(n => !!n.title)?.title
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

export function useStoredLocalFilesWithNoMatch() {

    const isLoading = useAtomValue(_matchingRecommendationIsLoading) // Loading state
    const [value, setter] = useAtom(localFilesWithNoMatchAtom) // Local files with no match
    const groups = useAtomValue(libraryMatchingRecommendationGroupsAtom) // Recommendation groups

    const [, setLibraryEntries] = useAtom(libraryEntriesAtom)

    const [, getRecommendations] = useAtom(getRecommendationPerGroupAtom)

    const handleManualEntry = (media: AnilistSimpleMedia, filePaths: string[], sharedPath: string) => {
        const filePathsSet = new Set(filePaths)
        const selectedLocalFiles = value.filter(file => filePathsSet.has(file.path))

        setLibraryEntries(prevEntries => {
            const updatedEntries = [...prevEntries]
            const existingEntryIndex = updatedEntries.findIndex(entry => entry.media.id === media.id)

            if (existingEntryIndex !== -1) { // If entry already exists (entry with same media)
                const existingEntry = updatedEntries[existingEntryIndex] // Get the existing entry

                updatedEntries[existingEntryIndex] = { // Update the existing entry
                    ...existingEntry,
                    files: [ // Overwrite the files but keep files to add manually entered files as locked
                        ...existingEntry.files,
                        ...selectedLocalFiles.map(file => ({ ...file, locked: true })),
                    ],
                }
            } else { // If no entry with that media exist, create a new one
                const newEntry = {
                    media: media,
                    files: selectedLocalFiles.map(file => ({ ...file, locked: true })),
                    accuracy: 1,
                    sharedPath: sharedPath,
                }
                updatedEntries.push(newEntry)
            }

            return updatedEntries
        })

        setter(files => {
            // Keep files that were not manually entered
            return files.filter(file => !filePathsSet.has(file.path))
        })
        getRecommendations()
    }

    const handleIgnoreFiles = (filePaths: string[]) => {
        const filePathsSet = new Set(filePaths)
        setter(files => {
            // Go through each files with no match
            return files.map(file => {
                // If the file path is in the array that will be ignored, set property ignored to true
                return filePathsSet.has(file.path) ? { ...file, ignored: true } : file
            })
        })
        getRecommendations()
    }

    return {
        getRecommendations: getRecommendations,
        filesWithNoMatch: value.filter(file => !file.ignored),
        nbFilesWithNoMatch: value.filter(file => !file.ignored).length,
        groups,
        storeFilesWithNoMatch: setter,
        recommendationMatchingIsLoading: isLoading,
        handleManualEntry,
        handleIgnoreFiles,
    }

}

/* -------------------------------------------------------------------------------------------------
 * Locked and ignored paths
 * -----------------------------------------------------------------------------------------------*/

/**
 * Get files that are locked from stored entries
 * Get files that are ignored from stored entries and stored files with no match
 */
export function useLockedAndIgnoredFilePaths() {

    const filesWithNoMatch = useAtomValue(localFilesWithNoMatchAtom)
    const entries = useAtomValue(libraryEntriesAtom)

    return {
        lockedPaths: entries.flatMap(entry => entry.files).filter(file => file.locked).map(file => file.path),
        ignoredPaths: [
            ...entries.flatMap(entry => entry.files).filter(file => file.ignored).map(file => file.path),
            ...filesWithNoMatch.filter(file => file.ignored).map(file => file.path),
        ],
    }

}

/* -------------------------------------------------------------------------------------------------
 * Current viewing media
 * -----------------------------------------------------------------------------------------------*/
