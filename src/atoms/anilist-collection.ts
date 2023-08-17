import { atom } from "jotai"
import { aniListTokenAtom } from "@/atoms/auth"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeCollectionDocument, AnimeCollectionQuery } from "@/gql/graphql"
import { userAtom } from "@/atoms/user"
import { useAtom, useAtomValue } from "jotai/react"
import { useMemo } from "react"
import { AnilistMedia } from "@/lib/anilist/fragment"
import _ from "lodash"
import { logger } from "@/lib/helpers/debug"
import { atomWithStorage } from "jotai/utils"
import toast from "react-hot-toast"

export type AnilistCollection = AnimeCollectionQuery["MediaListCollection"]

/**
 * We will store the fetched Anilist Collection
 */
export const anilistCollectionAtom = atomWithStorage<AnimeCollectionQuery["MediaListCollection"]>("sea-anilist-user-list", undefined)

const isLoadingAtom = atom<boolean>(false)

export const getAnilistCollectionAtom = atom(null, async (get, set) => {
    try {
        const token = get(aniListTokenAtom)
        const user = get(userAtom)
        if (token && user?.name) {
            set(isLoadingAtom, true)
            logger("atom/anilist-collection").info("Fetching AniList collection")
            const res = await useAniListAsyncQuery(AnimeCollectionDocument, { userName: user.name }, token)
            if (res.MediaListCollection) {
                set(anilistCollectionAtom, res.MediaListCollection)
            }
            set(isLoadingAtom, false)
            toast.success("AniList is up to date")
        } else {
            // set(anilistCollectionAtom, undefined)
        }
    } catch (e) {
        logger("atom/anilist-collection").error("Error fetching AniList collection")
        set(anilistCollectionAtom, undefined)
    }
})

export const useStoredAnilistCollection = () => {

    const [data, setData] = useAtom(anilistCollectionAtom)
    const isLoading = useAtomValue(isLoadingAtom)
    const [, refetch] = useAtom(getAnilistCollectionAtom)

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

    const pausedList = useMemo(() => {
        let arr = collection.filter(n => !!n && n.status === "PAUSED")
        // Sort by name
        arr = _.sortBy(arr, entry => entry?.media?.title?.userPreferred).reverse()
        // Sort by score
        arr = _.sortBy(arr, entry => entry?.score).reverse()
        return arr
    }, [collection])

    return {
        isLoading,
        collection,
        refetchCollection: () => {
            // refetch()
            setData(undefined)
        },
        allUserMedia,
        currentlyWatchingList,
        completedList,
        planningList,
        pausedList,
        getMediaListEntry: (mediaId: number) => {
            return collection.find(collectionEntry => collectionEntry?.media?.id === mediaId)
        },
    }

}
