import { atom, PrimitiveAtom } from "jotai"
import { aniListTokenAtom } from "@/atoms/auth"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeCollectionDocument, AnimeCollectionQuery, MediaListStatus } from "@/gql/graphql"
import { userAtom } from "@/atoms/user"
import { useAtom, useAtomValue } from "jotai/react"
import _ from "lodash"
import { logger } from "@/lib/helpers/debug"
import { atomWithStorage, selectAtom, splitAtom } from "jotai/utils"
import toast from "react-hot-toast"
import { useCallback, useMemo } from "react"
import deepEquals from "fast-deep-equal"
import { AnilistMedia, AnilistSimpleMedia } from "@/lib/anilist/fragment"

export type AnilistCollection = AnimeCollectionQuery["MediaListCollection"]
// Typescript's being annoying, so I had to extract the type myself
export type AnilistCollectionEntry = {
    score?: number | null,
    progress?: number | null,
    status?: MediaListStatus | null,
    notes?: string | null,
    repeat?: number | null,
    private?: boolean | null,
    startedAt?: { year?: number | null, month?: number | null, day?: number | null } | null,
    completedAt?: { year?: number | null, month?: number | null, day?: number | null } | null,
    media?: AnilistMedia | null
} | null | undefined

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
 * Anilist Collection Entries
 * - Each entry holds specific data like score, progress...
 * - Each entry also contains a specific media
 * -----------------------------------------------------------------------------------------------*/

export const anilistCollectionEntriesAtom = atom<AnilistCollectionEntry[]>((get) => {
    const arr = get(anilistCollectionAtom)?.lists?.map(n => n?.entries)?.flat().filter(Boolean)
    return arr !== undefined ? arr : []
})

/**
 * Split collection entries by media ID
 */
export const anilistCollectionEntryAtoms = splitAtom(anilistCollectionEntriesAtom, collectionEntry => collectionEntry?.media?.id)

// Read
const getAnilist_CollectionEntry_Atoms_ByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => get(anilistCollectionEntryAtoms).find((entryAtom) => get(entryAtom)?.media?.id === mediaId),
)

export const useAnilistCollectionEntryAtomByMediaId = (mediaId: number) => {
    const [, get] = useAtom(getAnilist_CollectionEntry_Atoms_ByMediaIdAtom)
    return useMemo(() => get(mediaId), []) as PrimitiveAtom<AnilistCollectionEntry> | undefined
}

export const useAnilistCollectionEntryByMediaId = (mediaId: number) => {
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

export const allUserMediaAtoms = splitAtom(allUserMediaAtom, media => media.id)

/** Read **/

export const getUserMediaByIdAtom = atom(null,
    (get, set, mediaId: number) => get(allUserMediaAtoms).find((media) => get(media).id === mediaId),
)

/**
 * @example
 * const media = useAnilistUserMedia(21)
 *
 * const title = media?.title?.english //=> One Piece
 */
export const useAnilistUserMedia = (mediaId: number) => {
    return useAtomValue(
        selectAtom(
            allUserMediaAtom,
            useCallback(media => media.find(medium => medium.id === mediaId), []), // Stable reference
            deepEquals, // Equality check
        ),
    )
}

/**
 * @example
 * const mediaAtom = useAnilistUserMediaAtom(21)
 *
 * const value = useAtomValue(
 *     selectAtom(
 *         mediaAtom,
 *         useCallback(media => media[property], []),
 *         deepEquals,
 *     ),
 * )
 */
export const useAnilistUserMediaAtom = (mediaId: number) => {
    const [, get] = useAtom(getUserMediaByIdAtom)
    return useMemo(() => get(mediaId), []) as PrimitiveAtom<AnilistSimpleMedia> | undefined
}

export const useAnilistUserMediaAtoms = () => {
    const value = useAtomValue(allUserMediaAtoms)
    return useMemo(() => value, []) as Array<PrimitiveAtom<AnilistSimpleMedia>>
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
