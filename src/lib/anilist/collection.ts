import { useCurrentUser } from "@/atoms/user"
import { AnimeCollectionDocument } from "@/gql/graphql"
import { useAniListClientQuery } from "@/hooks/graphql-client-helpers"
import { useMemo } from "react"
import _ from "lodash"
import { AnilistMedia } from "@/lib/anilist/fragment"

export function useAnilistCollection() {

    const { user } = useCurrentUser()

    const { data, isLoading } = useAniListClientQuery(AnimeCollectionDocument, { userName: user?.name })

    // Flatten all lists CURRENT, COMPLETED...
    // [{ entries: [] }, { entries: [] }] => [{}, {}]
    const collection = useMemo(() => data?.MediaListCollection?.lists?.map(n => n?.entries).flat() ?? [], [data])

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

    const pausedList = useMemo(() => {
        let arr = collection.filter(n => !!n && n.status === "PAUSED")
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
        isLoading,
        originalCollection: data?.MediaListCollection?.lists ?? [],
        collection,
        currentlyWatchingList,
        completedList,
        planningList,
        pausedList,
        allUserMedia,
    }

}
