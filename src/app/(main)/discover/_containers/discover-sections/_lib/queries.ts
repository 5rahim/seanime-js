import { useInfiniteQuery } from "@tanstack/react-query"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { ListAnimeDocument } from "@/gql/graphql"
import { useAniListClientQuery } from "@/hooks/graphql-client-helpers"

export function useDiscoverTrendingAnime() {

    return useInfiniteQuery({
        queryKey: ["projects"],
        queryFn: async ({ pageParam = 1 }) => {
            return useAniListAsyncQuery(ListAnimeDocument, {
                page: pageParam,
                perPage: 20,
                sort: "TRENDING_DESC",
            })
        },
        getNextPageParam: (lastPage, pages) => {
            const curr = lastPage.Page?.pageInfo?.currentPage
            const hasNext = lastPage.Page?.pageInfo?.hasNextPage
            return (!!curr && hasNext && curr < 4) ? pages.length + 1 : undefined
        },
    })

}

export function useDiscoverUpcomingAnime() {
    return useAniListClientQuery(ListAnimeDocument, {
        page: 1,
        perPage: 20,
        sort: "TRENDING_DESC",
        status: "NOT_YET_RELEASED",
    })
}

export function useDiscoverPopularAnime() {
    return useAniListClientQuery(ListAnimeDocument, {
        page: 1,
        perPage: 20,
        sort: "POPULARITY_DESC",
    })
}

export function useDiscoverTrendingMovies() {
    return useAniListClientQuery(ListAnimeDocument, {
        page: 1,
        perPage: 20,
        format: "MOVIE",
        sort: "TRENDING_DESC",
    })
}
