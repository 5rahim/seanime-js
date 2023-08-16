import { atomWithStorage } from "jotai/utils"
import { LocalFile } from "@/lib/local-library/local-file"
import { useAtom, useAtomValue } from "jotai/react"
import { LibraryEntry } from "@/lib/local-library/library-entry"
import { rejectedSnapshot } from "@/lib/local-library/mock_2"
import { atom } from "jotai"
import { logger } from "@/lib/helpers/debug"
import _ from "lodash"
import { fetchMALRecommendations } from "@/lib/mal/fetch-recommendations"

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

// TODO Store locked file paths that will be used by async functions to ignore these files and speed up
// TODO Store ignored files

/* -------------------------------------------------------------------------------------------------
 * Local files with no match
 * -----------------------------------------------------------------------------------------------*/

export const localFilesWithNoMatchAtom = atomWithStorage<LocalFile[]>("sea-local-files-with-no-match", rejectedSnapshot)

export type MatchingRecommendationGroup = {
    files: LocalFile[],
    folderPath: string,
    recommendations: any // From MAL
}
export const libraryMatchingRecommendationGroupsAtom = atomWithStorage<MatchingRecommendationGroup[]>("sea-library-matching-recommendation-groups", [])

const getRecommendationPerGroupAtom = atom(null, async (get, set) => {
    try {
        const files = get(localFilesWithNoMatchAtom)
        if (files.length > 0) {
            //
            logger("atom/library").info("Grouping local files with no media")
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
                const _title = lFiles[0]?.parsedFolders.findLast(n => !!n.title)?.title || lFiles[0]?.parsedInfo?.title
                try {
                    if (_title) {
                        const anime = await fetchMALRecommendations(_title)

                        if (anime) {
                            groups = [...groups, {
                                files: lFiles,
                                folderPath: commonPath,
                                recommendations: anime,
                            }]
                        }
                    }
                } catch (e) {
                    logger("atom/library").error(e)
                }
            }

            logger("atom/library").info("Matching recommendation groups", groups)
            set(libraryMatchingRecommendationGroupsAtom, groups)


        } else {
        }
    } catch (e) {
    }
})

export function useStoredLocalFilesWithNoMatch() {

    const [value, setter] = useAtom(localFilesWithNoMatchAtom)
    const [, getRecommendations] = useAtom(getRecommendationPerGroupAtom)

    return {
        getRecommendations: getRecommendations,
        files: value,
        storeFilesWithNoMatch: setter,
    }

}

export function useMatchingRecommendationGroups() {

    const groups = useAtomValue(libraryMatchingRecommendationGroupsAtom)

    return {
        groups,
    }


}
