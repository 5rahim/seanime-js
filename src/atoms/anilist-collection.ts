import { atom } from "jotai"
import { aniListTokenAtom } from "@/atoms/auth"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeCollectionDocument, AnimeCollectionQuery } from "@/gql/graphql"
import { userAtom } from "@/atoms/user"
import { useAtom, useAtomValue } from "jotai/react"
import _ from "lodash"
import { logger } from "@/lib/helpers/debug"
import { atomWithStorage, selectAtom, splitAtom } from "jotai/utils"
import toast from "react-hot-toast"
import { useCallback, useMemo } from "react"
import deepEquals from "fast-deep-equal"
import { AnilistSimpleMedia } from "@/lib/anilist/fragment"

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

                // Set Anilist collection
                set(anilistCollectionAtom, res.MediaListCollection)

                // Set all user media
                const collectionEntries = res.MediaListCollection?.lists?.map(n => n?.entries).flat() ?? []
                // Get media from user's watchlist as [AnilistMedia]
                const userMedia = collectionEntries.filter(Boolean).map(entry => entry.media)
                // Normalize [AnilistMedia] to [AnilistSimpleMedia]
                const watchListMedia = userMedia.map(media => _.omit(media, "streamingEpisodes", "relations", "studio", "description", "format", "source", "isAdult", "genres", "trailer", "countryOfOrigin", "studios")) ?? []
                // Get related [AnilistSimpleMedia]
                const relatedMedia = userMedia
                    .filter(Boolean)
                    .flatMap(media => media.relations?.edges?.filter(edge => edge?.relationType === "PREQUEL"
                        || edge?.relationType === "SEQUEL"
                        || edge?.relationType === "SPIN_OFF"
                        || edge?.relationType === "SIDE_STORY"
                        || edge?.relationType === "ALTERNATIVE"
                        || edge?.relationType === "PARENT")
                        .flatMap(edge => edge?.node).filter(Boolean),
                    ) as AnilistSimpleMedia[]

                // Set all media
                set(allUserMediaAtom, _.uniqBy([...watchListMedia, ...relatedMedia], media => media.id))

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

/**
 * @example
 * const refetchCollection = useRefreshAnilistCollection()
 */
export const useRefreshAnilistCollection = () => {
    const [, get] = useAtom(getAnilistCollectionAtom)
    return useMemo(() => get, [])
}

/* -------------------------------------------------------------------------------------------------
 * Anilist Entry Collection
 * -----------------------------------------------------------------------------------------------*/

export const anilistCollectionEntriesAtom = atom((get) => (get(anilistCollectionAtom)?.lists?.map(n => n?.entries).flat() ?? []))

export const useAnilistEntryByMediaId = (mediaId: number) => {
    return useAtomValue(
        selectAtom(
            anilistCollectionEntriesAtom,
            useCallback(entries => entries.find(entry => entry?.media?.id === mediaId), []), // Stable reference
            deepEquals, // Equality check
        ),
    )
}

/* -------------------------------------------------------------------------------------------------
 * All media
 * -----------------------------------------------------------------------------------------------*/

export const allUserMediaAtom = atomWithStorage<AnilistSimpleMedia[]>("sea-anilist-media", [], undefined, { unstable_getOnInit: true })
export const allUserMediaAtomAtoms = splitAtom(allUserMediaAtom)


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
