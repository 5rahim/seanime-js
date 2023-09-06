"use client"
import { Slider } from "@/components/shared/slider"
import { useAniListClientQuery } from "@/hooks/graphql-client-helpers"
import { ListAnimeDocument } from "@/gql/graphql"
import { AnimeListItem } from "@/components/shared/anime-list-item"
import { Skeleton } from "@/components/ui/skeleton"

export default function Page() {

    const { data: trendingAnime, isLoading: trendingLoading } = useAniListClientQuery(ListAnimeDocument, {
        page: 1,
        perPage: 20,
        sort: ["TRENDING_DESC"],
    })

    const {
        data: trendingNotReleasedAnime,
        isLoading: trendingNotReleasedLoading,
    } = useAniListClientQuery(ListAnimeDocument, {
        page: 1,
        perPage: 20,
        sort: ["TRENDING_DESC"],
        status: "NOT_YET_RELEASED",
    })
    const { data: popularAnime, isLoading: popularLoading } = useAniListClientQuery(ListAnimeDocument, {
        page: 1,
        perPage: 20,
        sort: ["POPULARITY_DESC", "START_DATE"],
    })
    const { data: popularMovies, isLoading: popularMoviesLoading } = useAniListClientQuery(ListAnimeDocument, {
        page: 1,
        perPage: 20,
        format: "MOVIE",
        sort: ["TRENDING_DESC"],
    })

    return (
        <div className={"px-4 pt-8 space-y-10 pb-10"}>
            <div className={"space-y-2"}>
                <h2>Most popular this season</h2>
                <Slider>
                    {!trendingLoading ? trendingAnime?.Page?.media?.filter(Boolean).map(media => {
                        return (
                            <AnimeListItem
                                mediaId={media.id}
                                media={media}
                                showLibraryBadge
                                containerClassName={"min-w-[250px] max-w-[250px] mt-8"}
                            />
                        )
                    }) : [...Array(10).keys()].map((v, idx) => <AnimeListItemSkeleton key={idx}/>)}
                </Slider>
            </div>
            <div className={"space-y-2"}>
                <h2>Popular shows</h2>
                <Slider>
                    {!popularLoading ? popularAnime?.Page?.media?.filter(Boolean).map(media => {
                        return (
                            <AnimeListItem
                                mediaId={media.id}
                                media={media}
                                showLibraryBadge
                                containerClassName={"min-w-[250px] max-w-[250px] mt-8"}
                            />
                        )
                    }) : [...Array(10).keys()].map((v, idx) => <AnimeListItemSkeleton key={idx}/>)}
                </Slider>
            </div>
            <div className={"space-y-2"}>
                <h2>Trending upcoming</h2>
                <Slider>
                    {!trendingNotReleasedLoading ? trendingNotReleasedAnime?.Page?.media?.filter(Boolean).map(media => {
                        return (
                            <AnimeListItem
                                mediaId={media.id}
                                media={media}
                                showLibraryBadge
                                containerClassName={"min-w-[250px] max-w-[250px] mt-8"}
                            />
                        )
                    }) : [...Array(10).keys()].map((v, idx) => <AnimeListItemSkeleton key={idx}/>)}
                </Slider>
            </div>
            <div className={"space-y-2"}>
                <h2>Trending movies</h2>
                <Slider>
                    {!popularMoviesLoading ? popularMovies?.Page?.media?.filter(Boolean).map(media => {
                        return (
                            <AnimeListItem
                                mediaId={media.id}
                                media={media}
                                showLibraryBadge
                                containerClassName={"min-w-[250px] max-w-[250px] mt-8"}
                            />
                        )
                    }) : [...Array(10).keys()].map((v, idx) => <AnimeListItemSkeleton key={idx}/>)}
                </Slider>
            </div>
        </div>
    )
}

const AnimeListItemSkeleton = () => {
    return (
        <>
            <Skeleton
                className={"min-w-[250px] max-w-[250px] h-[350px] bg-gray-700 rounded-md mt-8"}
            />
        </>
    )
}
