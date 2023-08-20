import { Atom, atom } from "jotai"
import { aniListTokenAtom } from "@/atoms/auth"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeCollectionDocument, AnimeCollectionQuery, ShortMediaFragment } from "@/gql/graphql"
import { userAtom } from "@/atoms/user"
import { useAtom, useAtomValue, useSetAtom } from "jotai/react"
import _ from "lodash"
import { logger } from "@/lib/helpers/debug"
import { atomWithStorage, splitAtom } from "jotai/utils"
import toast from "react-hot-toast"

export type AnilistCollection = AnimeCollectionQuery["MediaListCollection"]

/**
 * We will store the fetched Anilist Collection
 */
export const anilistCollectionAtom = atomWithStorage<AnimeCollectionQuery["MediaListCollection"]>("sea-anilist-user-list", undefined, undefined, { unstable_getOnInit: true })

const _isLoadingAtom = atom<boolean>(false)

/* -------------------------------------------------------------------------------------------------
 * Fetch user's collection
 * -----------------------------------------------------------------------------------------------*/

export const getAnilistCollectionAtom = atom(null, async (get, set) => {
    try {
        const token = get(aniListTokenAtom)
        const user = get(userAtom)
        if (token && user?.name) {
            set(_isLoadingAtom, true)
            logger("atom/anilist-collection").info("Fetching AniList collection")
            const res = await useAniListAsyncQuery(AnimeCollectionDocument, { userName: user.name }, token)
            if (res.MediaListCollection) {
                set(anilistCollectionAtom, res.MediaListCollection)
            }
            set(_isLoadingAtom, false)
            toast.success("AniList is up to date")
        } else {
            // set(anilistCollectionAtom, undefined)
        }
    } catch (e) {
        logger("atom/anilist-collection").error("Error fetching AniList collection")
        set(anilistCollectionAtom, undefined)
    }
})

/* -------------------------------------------------------------------------------------------------
 * Anilist Entry Collection
 * -----------------------------------------------------------------------------------------------*/

export const anilistCollectionEntriesAtom = atom((get) => (get(anilistCollectionAtom)?.lists?.map(n => n?.entries).flat() ?? []))

export const anilistCollectionEntriesAtoms = splitAtom(anilistCollectionEntriesAtom)

export const getAnilistEntryByMediaIdAtom = atom(undefined,
    (get, set, payload: number) => {
        return get(anilistCollectionEntriesAtoms).find((itemAtom) => get(atom((get) => get(itemAtom)?.media?.id === payload))) ?? atom(undefined)
    },
)

export const getAnilistEntryByMediaId = (mediaId: number) => {
    const get = useSetAtom(getAnilistEntryByMediaIdAtom)
    return get(mediaId)
}

/* -------------------------------------------------------------------------------------------------
 * All media
 * -----------------------------------------------------------------------------------------------*/

export const allUserMediaAtom = atom((get) => get(anilistCollectionEntriesAtom).filter(Boolean).map(entry => entry.media))
export const allUserMediaAtomAtoms = splitAtom(allUserMediaAtom)

export const getUserMediaByIdAtom = atom(undefined,
    (get, set, payload: number) => {
        return get(allUserMediaAtomAtoms).find((itemAtom) => get(atom((get) => get(itemAtom)?.id === payload))) ?? atom(undefined)
    },
)

export const getUserMediaById = (mediaId: number): Atom<ShortMediaFragment | null | undefined> => {
    const get = useSetAtom(getUserMediaByIdAtom)
    return get(mediaId)
}

/* -------------------------------------------------------------------------------------------------
 * Different lists
 * -----------------------------------------------------------------------------------------------*/

export const anilistCompletedListAtom = atom((get) => {
    let arr = get(anilistCollectionEntriesAtom).filter(n => !!n && n.status === "COMPLETED")
    // Sort by name
    arr = _.sortBy(arr, entry => entry?.media?.title?.userPreferred).reverse()
    // Sort by score
    arr = _.sortBy(arr, entry => entry?.score).reverse()
    return arr
})
export const anilistCurrentlyWatchingListAtom = atom((get) => {
    let arr = get(anilistCollectionEntriesAtom).filter(n => !!n && n.status === "CURRENT")
    // Sort by name
    arr = _.sortBy(arr, entry => entry?.media?.title?.userPreferred).reverse()
    // Sort by score
    arr = _.sortBy(arr, entry => entry?.score).reverse()
    return arr
})
export const anilistPlanningListAtom = atom((get) => {
    let arr = get(anilistCollectionEntriesAtom).filter(n => !!n && n.status === "PLANNING")
    // Sort by name
    arr = _.sortBy(arr, entry => entry?.media?.title?.userPreferred)
    // Sort by airing -> Releasing first
    arr = _.sortBy(arr, entry => entry?.media?.status !== "RELEASING")
    return arr
})
export const anilistPausedListAtom = atom((get) => {
    let arr = get(anilistCollectionEntriesAtom).filter(n => !!n && n.status === "PAUSED")
    // Sort by name
    arr = _.sortBy(arr, entry => entry?.media?.title?.userPreferred).reverse()
    // Sort by score
    arr = _.sortBy(arr, entry => entry?.score).reverse()
    return arr
})

/**
 * @example
 * const refetchCollection = useRefreshAnilistCollection()
 */
export const useRefreshAnilistCollection = () => {
    const [, get] = useAtom(getAnilistCollectionAtom)
    return () => get()
}

export const useStoredAnilistCollection = () => {
    const isLoading = useAtomValue(_isLoadingAtom)
    const collection = useAtomValue(anilistCollectionEntriesAtom)
    const allUserMedia = useAtomValue(allUserMediaAtom)
    const currentlyWatchingList = useAtomValue(anilistCurrentlyWatchingListAtom)
    const completedList = useAtomValue(anilistCompletedListAtom)
    const planningList = useAtomValue(anilistPlanningListAtom)
    const pausedList = useAtomValue(anilistPausedListAtom)

    return {
        isLoading,
        collection,
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
