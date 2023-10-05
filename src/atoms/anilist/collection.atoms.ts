import { atom, useAtom, useAtomValue } from "jotai"
import { anilistClientTokenAtom } from "@/atoms/auth"
import { userAtom } from "@/atoms/user"
import { logger } from "@/lib/helpers/debug"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeCollectionDocument, AnimeCollectionQuery } from "@/gql/graphql"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import toast from "react-hot-toast"
import { atomWithStorage } from "jotai/utils"
import { useCallback } from "react"
import uniqBy from "lodash/uniqBy"
import { allUserMediaAtom } from "@/atoms/anilist/media.atoms"
import { anilist_shortMediaToShowcaseMedia } from "@/lib/anilist/utils"
import { useInterval } from "react-use"

/* -------------------------------------------------------------------------------------------------
 * Raw collection
 * -----------------------------------------------------------------------------------------------*/

export type AnilistCollection = AnimeCollectionQuery["MediaListCollection"]
/**
 * We will store the fetched Anilist Collection
 */
export const anilistCollectionAtom = atomWithStorage<AnilistCollection>("sea-anilist-user-list", undefined, undefined, { unstable_getOnInit: true })

export const __refreshTimestampAtom = atomWithStorage("sea-anilist-refresh-timestamp", 0, undefined, { unstable_getOnInit: true })

export const anilistCollectionIsDefinedAtom = atom(get => get(anilistCollectionAtom) !== undefined)

export const getAnilistCollectionAtom = atom(null, async (get, set, options: { muteAlert: boolean }) => {
    try {
        const token = get(anilistClientTokenAtom)
        const user = get(userAtom)
        if (token && user?.name) {
            logger("atom/anilist-collection").info("Fetching AniList collection")
            const res = await useAniListAsyncQuery(AnimeCollectionDocument, { userName: user.name }, token)
            if (res.MediaListCollection) {

                // Set Anilist collection
                set(anilistCollectionAtom, res.MediaListCollection)

                // Set all user media
                const collectionEntries = res.MediaListCollection?.lists?.map(n => n?.entries).flat() ?? []
                // Get media from user's anime list as [AnilistShortMedia]
                const userMedia = collectionEntries.filter(Boolean).map(entry => entry.media)
                // Normalize [AnilistShortMedia] to [AnilistShowcaseMedia]
                const watchListMedia = userMedia.filter(Boolean).map(media => anilist_shortMediaToShowcaseMedia(media)) ?? []
                // Get related [AnilistShowcaseMedia]
                const relatedMedia = userMedia
                    .filter(Boolean)
                    .flatMap(media => media.relations?.edges?.filter(edge => edge?.relationType === "PREQUEL"
                        || edge?.relationType === "SEQUEL"
                        || edge?.relationType === "SPIN_OFF"
                        || edge?.relationType === "SIDE_STORY"
                        || edge?.relationType === "ALTERNATIVE"
                        || edge?.relationType === "PARENT")
                        .flatMap(edge => edge?.node).filter(Boolean),
                    ) as AnilistShowcaseMedia[]

                // Set all media
                set(allUserMediaAtom, uniqBy([...watchListMedia, ...relatedMedia], media => media.id))

            }
            if (!options.muteAlert) toast.success("AniList is up to date")
        } else {
            toast.error("Unauthenticated")
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
    return useCallback((options?: { muteAlert: boolean }) => {
        return get({
            muteAlert: options?.muteAlert || false,
        })
    }, [])
}

export const useRefreshAnilistCollectionPeriodically = () => {

    const [refreshTimestamp, setRefreshTimestamp] = useAtom(__refreshTimestampAtom)
    const refreshCollection = useRefreshAnilistCollection()
    const token = useAtomValue(anilistClientTokenAtom)

    useInterval(() => {
        if (token) {
            const now = new Date().getTime()
            // Check if refreshTimestamp is older than 1 minute
            if (now - refreshTimestamp > 60 * 10 * 1000) {
                // Refresh collection
                refreshCollection({ muteAlert: true })
                // Update refreshTimestamp
                setRefreshTimestamp(now)
            }
        }
    }, 10000)

}
