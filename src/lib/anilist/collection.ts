import { useCurrentUser } from "@/atoms/user"
import { AnimeCollectionDocument } from "@/gql/graphql"
import { useAniListClientQuery } from "@/hooks/graphql-client-helpers"
import { useMemo } from "react"

export function useAnilistCollection() {

    const { user } = useCurrentUser()

    const { data, isLoading } = useAniListClientQuery(AnimeCollectionDocument, { userName: user?.name })

    // Flatten all lists CURRENT, COMPLETED...
    // [{ entries: [] }, { entries: [] }] => [{}, {}]
    const collection = useMemo(() => data?.MediaListCollection?.lists?.map(n => n?.entries).flat() ?? [], [data])

    const currentlyWatchingList = useMemo(() => collection.filter(n => !!n && n.status === "CURRENT"), [collection])

    return {
        isLoading,
        originalCollection: data?.MediaListCollection?.lists ?? [],
        collection,
        currentlyWatchingList,
    }

}
