import { atom } from "jotai"
import { aniListTokenAtom } from "@/atoms/auth"
import { userAtom } from "@/atoms/user"
import { logger } from "@/lib/helpers/debug"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeCollectionDocument, AnimeCollectionQuery } from "@/gql/graphql"
import _ from "lodash"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import toast from "react-hot-toast"
import { atomWithStorage } from "jotai/utils"
import { useAtom } from "jotai/react"
import { useMemo } from "react"

import { allUserMediaAtom } from "@/atoms/anilist/media.atoms"

/* -------------------------------------------------------------------------------------------------
 * Raw collection
 * -----------------------------------------------------------------------------------------------*/

export type AnilistCollection = AnimeCollectionQuery["MediaListCollection"]
/**
 * We will store the fetched Anilist Collection
 */
export const anilistCollectionAtom = atomWithStorage<AnilistCollection>("sea-anilist-user-list", undefined, undefined, { unstable_getOnInit: true })
export const getAnilistCollectionAtom = atom(null, async (get, set) => {
    try {
        const token = get(aniListTokenAtom)
        const user = get(userAtom)
        if (token && user?.name) {
            logger("atom/anilist-collection").info("Fetching AniList collection")
            const res = await useAniListAsyncQuery(AnimeCollectionDocument, { userName: user.name }, token)
            if (res.MediaListCollection) {

                // Set Anilist collection
                set(anilistCollectionAtom, res.MediaListCollection)

                // Set all user media
                const collectionEntries = res.MediaListCollection?.lists?.map(n => n?.entries).flat() ?? []
                // Get media from user's watchlist as [AnilistShortMedia]
                const userMedia = collectionEntries.filter(Boolean).map(entry => entry.media)
                // Normalize [AnilistShortMedia] to [AnilistShowcaseMedia]
                const watchListMedia = userMedia.map(media => _.omit(media, "streamingEpisodes", "relations", "studio", "description", "format", "source", "isAdult", "genres", "trailer", "countryOfOrigin", "studios")) ?? []
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
                set(allUserMediaAtom, _.uniqBy([...watchListMedia, ...relatedMedia], media => media.id))

            }
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
