import { LocalFile } from "@/lib/local-library/local-file"
import { atom } from "jotai"
import { logger } from "@/lib/helpers/debug"
import _ from "lodash"
import { searchWithMAL } from "@/lib/mal/actions"
import { useAtom, useAtomValue } from "jotai/react"

import { localFilesAtom } from "@/atoms/library/local-file.atoms"
import { MALSearchResultAnime } from "@/lib/mal/types"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import gql from "graphql-tag"
import { AnilistShortMedia } from "@/lib/anilist/fragment"
import { aniListTokenAtom } from "@/atoms/auth"

export type MatchingSuggestionGroups = {
    files: LocalFile[],
    folderPath: string,
    recommendations: Pick<AnilistShortMedia, "id" | "format" | "status" | "episodes" | "title" | "bannerImage" | "coverImage" | "startDate">[]
}
export const libraryMatchingSuggestionGroupsAtom = atom<MatchingSuggestionGroups[]>([])

const _isCurrentlyFetchingSuggestions = atom(false)

const getMatchingSuggestionGroupsAtom = atom(null, async (get, set, payload: "file" | "folder") => {
    try {
        // Get only files with no media that are not ignored
        const files = get(localFilesAtom).filter(file => !file.mediaId && !file.ignored)

        logger("atom/library/getMatchingSuggestionGroup").info(files.length)

        if (files.length > 0 && !!get(aniListTokenAtom)) {
            set(libraryMatchingSuggestionGroupsAtom, []) // Reset suggestions

            logger("atom/library/getMatchingSuggestionGroup").info("Grouping local files with no media")
            set(_isCurrentlyFetchingSuggestions, true)

            /** Grouping **/
            const filesWithFolderPath = files.map(file => {
                if (payload === "folder")
                    return ({ ...file, folderPath: file.path.replace("\\" + file.name, "") }) // <-- Group by folder path (folder by folder)
                else
                    return ({ ...file, folderPath: file.path }) // <-- Group by file path (file by path)
            }) as (LocalFile & { folderPath: string })[]
            const groupedByCommonParentName = _.groupBy(filesWithFolderPath, n => n.folderPath)

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
                            const res = await searchWithMAL(_title)
                            if (res && res.length > 0) {
                                animeList1 = res
                                fetchedSuggestionMap.set(_title, res)
                            }
                        } else if (_title) {
                            animeList1 = fetchedSuggestionMap.get(_title)
                        }
                        // folder title
                        if (_fTitle && !fetchedSuggestionMap.has(_fTitle)) {
                            const res = await searchWithMAL(_fTitle)
                            if (res && res.length > 0) {
                                animeList2 = res
                                fetchedSuggestionMap.set(_fTitle, res)
                            }
                        } else if (_fTitle) {
                            animeList2 = fetchedSuggestionMap.get(_fTitle)
                        }

                        const animeList = [...animeList1, ...animeList2]

                        // const aniListIds = await Promise.all(animeList.map(async item => {
                        //     const { data } = await axios.get<AniZipData>(`https://api.ani.zip/mappings?mal_id=${item.id}`)
                        //     return data.mappings.anilist_id
                        // }))

                        const res = await useAniListAsyncQuery<{
                            [key: string]: MatchingSuggestionGroups["recommendations"][number]
                        } | null, any>(gql`
                            query AnimeByMalId {
                                ${animeList.map(item => `
                                t${item.id}: Media(idMal: ${item.id}, type: ANIME) {
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
                        `, undefined, get(aniListTokenAtom))

                        console.log(res, Object.values(res || []))
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
                    logger("atom/library").error(e)
                }
            }
            fetchedSuggestionMap.clear()
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
    const [, getMatchingSuggestions] = useAtom(getMatchingSuggestionGroupsAtom)
    const isLoading = useAtomValue(_isCurrentlyFetchingSuggestions)

    return {
        getMatchingSuggestions,
        isLoading,
    }
}
