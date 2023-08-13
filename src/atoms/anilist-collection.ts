import { atom } from "jotai"
import { aniListTokenAtom } from "@/atoms/auth"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeCollectionDocument, AnimeCollectionQuery } from "@/gql/graphql"
import { userAtom } from "@/atoms/user"
import { useAtom, useAtomValue } from "jotai/react"
import { useMemo } from "react"
import { AnilistMedia } from "@/lib/anilist/fragment"
import _ from "lodash"

export type AnilistCollection = AnimeCollectionQuery["MediaListCollection"]

/**
 * We will store the fetched Anilist Collection
 */
export const anilistCollectionAtom = atom<AnimeCollectionQuery["MediaListCollection"]>(undefined)

export const getAnilistCollection = atom(null, async (get, set, payload) => {
    try {
        const token = get(aniListTokenAtom)
        const user = get(userAtom)
        if (token) {
            const res = await useAniListAsyncQuery(AnimeCollectionDocument, { userName: user?.name }, token)
            if (res.MediaListCollection) {
                set(anilistCollectionAtom, res.MediaListCollection)
            }
        } else {
            set(anilistCollectionAtom, undefined)
        }
    } catch (e) {
        set(anilistCollectionAtom, undefined)
    }
})

export const useStoredAnilistCollection = () => {

    const data = useAtomValue(anilistCollectionAtom)
    const [, refetch] = useAtom(getAnilistCollection)

    const collection = useMemo(() => data?.lists?.map(n => n?.entries).flat() ?? [], [data])

    const allUserMedia = useMemo(() => {
        return collection.filter(entry => !!entry).map(entry => entry!.media) as AnilistMedia[]
    }, [collection])

    const currentlyWatchingList = useMemo(() => collection.filter(n => !!n && n.status === "CURRENT"), [collection])

    const completedList = useMemo(() => {
        let arr = collection.filter(n => !!n && n.status === "COMPLETED")
        // Sort by name
        arr = _.sortBy(arr, entry => entry?.media?.title?.userPreferred).reverse()
        // Sort by score
        arr = _.sortBy(arr, entry => entry?.score).reverse()
        return arr
    }, [collection])

    const planningList = useMemo(() => {
        let arr = collection.filter(n => !!n && n.status === "PLANNING")
        // Sort by name
        arr = _.sortBy(arr, entry => entry?.media?.title?.userPreferred)
        // Sort by airing -> Releasing first
        arr = _.sortBy(arr, entry => entry?.media?.status !== "RELEASING")
        return arr
    }, [collection])

    return {
        refetchCollection: refetch,
        allUserMedia,
        currentlyWatchingList,
        completedList,
        planningList,
    }

}
