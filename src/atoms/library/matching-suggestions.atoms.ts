import { atom } from "jotai"
import { logger } from "@/lib/helpers/debug"
import { searchWithMAL } from "@/lib/mal/actions"
import { useAtom, useAtomValue } from "jotai/react"
import { localFilesAtom } from "@/atoms/library/local-file.atoms"
import { MALSearchResultAnime } from "@/lib/mal/types"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import gql from "graphql-tag"
import { AnilistShortMedia } from "@/lib/anilist/fragment"
import { anilistClientTokenAtom } from "@/atoms/auth"
import axios from "axios"
import { path_getDirectoryName } from "@/lib/helpers/path"
import { LocalFile } from "@/lib/local-library/types"
import groupBy from "lodash/groupBy"
import { AniZipData } from "@/lib/anizip/types"

export type MatchingSuggestionGroups = {
    files: LocalFile[],
    folderPath: string,
    recommendations: Pick<AnilistShortMedia, "id" | "format" | "status" | "episodes" | "title" | "bannerImage" | "coverImage" | "startDate">[]
}
export const libraryMatchingSuggestionGroupsAtom = atom<MatchingSuggestionGroups[]>([])

const isFetchingSuggestionsAtom = atom(false)

const getMatchingSuggestionGroupsAtom = atom(null, async (get, set, payload: "file" | "folder") => {
    try {
        // Get only files with no media that are not ignored
        const files = get(localFilesAtom).filter(file => !file.mediaId && !file.ignored)

        logger("atom/library/getMatchingSuggestionGroup").info(files.length)

        if (files.length > 0 && !!get(anilistClientTokenAtom)) {
            set(libraryMatchingSuggestionGroupsAtom, []) // Reset suggestions

            logger("atom/library/getMatchingSuggestionGroup").info("Grouping local files with no media")
            set(isFetchingSuggestionsAtom, true)

            /** Grouping **/
            const filesWithFolderPath = files.map(file => {
                if (payload === "folder")
                    return ({ ...file, folderPath: path_getDirectoryName(file.path) }) // <-- Group by folder path (folder by folder)
                else
                    return ({ ...file, folderPath: file.path }) // <-- Group by file path (file by path)
            }) as (LocalFile & { folderPath: string })[]
            const groupedByCommonParentName = groupBy(filesWithFolderPath, n => n.folderPath)

            /** Final groups **/
            let groups: MatchingSuggestionGroups[] = []

            logger("atom/library/getMatchingSuggestionGroup").info("Fetching suggestions for each group")

            // For performance reasons, store title that we've already fetched suggestions for
            const fetchedSuggestionMap = new Map()

            for (let i = 0; i < Object.keys(groupedByCommonParentName).length; i++) {
                const commonPath = Object.keys(groupedByCommonParentName)[i]
                const lFiles = filesWithFolderPath.filter(file => file.folderPath === commonPath)
                const _fTitle = lFiles[0]?.parsedFolderInfo.findLast(n => !!n.title)?.title
                const _title = lFiles[0]?.parsedInfo?.title
                try {
                    if ((_fTitle || _title)) {
                        let animeList1: MALSearchResultAnime[] = []
                        let animeList2: MALSearchResultAnime[] = []
                        // title
                        if (_title && !fetchedSuggestionMap.has(_title)) {
                            const res = await searchWithMAL(_title, 6)
                            if (res && res.length > 0) {
                                animeList1 = res
                                fetchedSuggestionMap.set(_title, res)
                            }
                        } else if (_title) {
                            animeList1 = fetchedSuggestionMap.get(_title)
                        }
                        // folder title
                        if (_fTitle && !fetchedSuggestionMap.has(_fTitle)) {
                            const res = await searchWithMAL(_fTitle, 6)
                            if (res && res.length > 0) {
                                animeList2 = res
                                fetchedSuggestionMap.set(_fTitle, res)
                            }
                        } else if (_fTitle) {
                            animeList2 = fetchedSuggestionMap.get(_fTitle)
                        }

                        const animeList = [...animeList1, ...animeList2]

                        const mappingResults = await Promise.allSettled(animeList.map(async item => {
                            return axios.get<AniZipData>(`https://api.ani.zip/mappings?mal_id=${item.id}`)
                        }))
                        // Remove non-existent mappings and get the actual Anilist ids
                        const anilistIds = mappingResults.map(result => {
                            if (result.status === "fulfilled") return result.value.data.mappings.anilist_id
                        }).filter(Boolean)

                        const res = await useAniListAsyncQuery<{
                            [key: string]: MatchingSuggestionGroups["recommendations"][number]
                        } | null, any>(gql`
                            query AnimeByMalId {
                                ${anilistIds.map(id => `
                                t${id}: Media(id: ${id}, type: ANIME) {
                                    id
                                    format
                                    status
                                    episodes
                                    startDate {
                                      year
                                      month
                                      day
                                    }
                                    title {
                                      romaji
                                      english
                                      native
                                      userPreferred
                                    }
                                    bannerImage
                                    coverImage {
                                      extraLarge
                                      large
                                      medium
                                      color
                                    }
                                }
                                `)}
                            }
                        `, undefined, get(anilistClientTokenAtom)!)

                        const recommendations = res ? Object.values(res) : []

                        if (animeList1.length > 0 || animeList2.length > 0) {
                            groups = [...groups, {
                                files: lFiles,
                                folderPath: commonPath,
                                recommendations: recommendations,
                            }]
                        }
                    }
                } catch (e) {
                    logger("atom/library/getMatchingSuggestionGroup").error(e)
                }
            }
            fetchedSuggestionMap.clear()
            set(isFetchingSuggestionsAtom, false)
            logger("atom/library/getMatchingSuggestionGroup").info("Matching suggestion groups", groups)
            set(libraryMatchingSuggestionGroupsAtom, groups)


        } else {
            set(libraryMatchingSuggestionGroupsAtom, [])
        }
    } catch (e) {
    }
})
export const useMatchingSuggestions = () => {
    const [, getMatchingSuggestions] = useAtom(getMatchingSuggestionGroupsAtom)
    const isLoading = useAtomValue(isFetchingSuggestionsAtom)

    return {
        getMatchingSuggestions,
        isLoading,
    }
}
