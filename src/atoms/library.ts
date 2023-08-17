import { atomWithStorage } from "jotai/utils"
import { LocalFile } from "@/lib/local-library/local-file"
import { useAtom, useAtomValue } from "jotai/react"
import { LibraryEntry } from "@/lib/local-library/library-entry"
import { atom } from "jotai"
import { logger } from "@/lib/helpers/debug"
import _ from "lodash"
import { fetchMALRecommendations } from "@/lib/mal/fetch-recommendations"
import { AnilistSimpleMedia } from "@/lib/anilist/fragment"

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

/* -------------------------------------------------------------------------------------------------
 * Local files
 * -----------------------------------------------------------------------------------------------*/

/**
 * We store the scanned [LocalFile]s from the local directory
 * - The user should preferably scan the local library once
 * - We will use the [LocalFile]s stored to organize the library entries
 */
export const localFilesAtom = atomWithStorage<LocalFile[]>("sea-local-files", [])

export function useStoredLocalFiles() {

    const [value, setter] = useAtom(localFilesAtom)

    return {
        localFiles: value,
        storeLocalFiles: setter,
    }

}


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
        const selectedLocalFiles = value.filter(file => filePaths.some(path => path === file.path))

        setLibraryEntries(entries => {
            const existingEntry = entries.find(entry => entry.media.id === media.id)
            if (existingEntry) {
                return entries.map(entry => {
                    if (entry.media.id === media.id) {
                        return {
                            ...entry,
                            files: [...entry.files, ...selectedLocalFiles.map(file => ({ ...file, locked: true }))],
                        }
                    }
                    return entry
                })
            } else {
                return [
                    ...entries,
                    {
                        media: media,
                        files: selectedLocalFiles,
                        accuracy: 1,
                        sharedPath: sharedPath,
                    },
                ]
            }
        })

        setter(files => {
            return files.filter(file => !filePaths.some(path => path === file.path))
        })
        getRecommendations()
    }

    const handleIgnoreFiles = (filePaths: string[]) => {
        setter(files => {
            return files.map(file => {
                if (filePaths.includes(file.path)) {
                    return {
                        ...file,
                        ignored: true,
                    }
                }
                return file
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
