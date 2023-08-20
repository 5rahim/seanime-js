import { atomWithStorage } from "jotai/utils"
import { LocalFile } from "@/lib/local-library/local-file"
import { atom } from "jotai/index"
import { logger } from "@/lib/helpers/debug"
import _ from "lodash"
import { fetchMALMatchingSuggestions } from "@/lib/mal/fetch-matching-suggestions"
import { useAtom, useAtomValue } from "jotai/react"

import { localFilesAtom } from "@/atoms/library/local-file.atoms"

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
                                animeList2 = res
                                fetchedSuggestionMap.set(_fTitle, res)
                            }
                        } else if (_fTitle) {
                            animeList2 = fetchedSuggestionMap.get(_fTitle)
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
