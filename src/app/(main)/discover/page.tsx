"use client"
import { Slider } from "@/components/shared/slider"
import { useAniListClientQuery } from "@/hooks/graphql-client-helpers"
import { ListAnimeDocument } from "@/gql/graphql"
import { AnimeListItem } from "@/components/shared/anime-list-item"
import { Skeleton } from "@/components/ui/skeleton"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import React, { useMemo } from "react"
import Image from "next/image"
import { TextInput } from "@/components/ui/text-input"
import { FiSearch } from "@react-icons/all-files/fi/FiSearch"
import { useRouter } from "next/navigation"

export default function Page() {

    const router = useRouter()

    // const { data: trendingAnime, isLoading: trendingLoading } = useAniListClientQuery(ListAnimeDocument, {
    //     page: 1,
    //     perPage: 20,
    //     sort: ["TRENDING_DESC"],
    // })
    const {
        data: trendingAnime, isLoading: trendingLoading,
        fetchNextPage: fetchNextTrending,
        status,
    } = useInfiniteQuery({
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


    const {
        data: trendingUpcomingAnime,
        isLoading: trendingUpcomingLoading,
    } = useAniListClientQuery(ListAnimeDocument, {
        page: 1,
        perPage: 20,
        sort: "TRENDING_DESC",
        status: "NOT_YET_RELEASED",
    })
    const { data: popularAnime, isLoading: popularLoading } = useAniListClientQuery(ListAnimeDocument, {
        page: 1,
        perPage: 20,
        sort: "POPULARITY_DESC",
    })
    const { data: popularMovies, isLoading: popularMoviesLoading } = useAniListClientQuery(ListAnimeDocument, {
        page: 1,
        perPage: 20,
        format: "MOVIE",
        sort: "TRENDING_DESC",
    })

    const randomNumber = useMemo(() => Math.floor(Math.random() * 6), [])

    const firstTrending = useMemo(() => trendingAnime?.pages?.flatMap(n => n.Page?.media).filter(Boolean)[randomNumber], [trendingAnime, randomNumber])

    return (
        <>
            <div className={"__header h-[20rem]"}>
                <div
                    className="h-[30rem] w-[calc(100%-5rem)] flex-none object-cover object-center absolute top-0 overflow-hidden">
                    <div
                        className={"w-full absolute z-[2] top-0 h-[15rem] bg-gradient-to-b from-[--background-color] to-transparent via"}
                    />
                    {firstTrending?.bannerImage && <Image
                        src={firstTrending.bannerImage}
                        alt={"banner image"}
                        fill
                        quality={100}
                        priority
                        sizes="100vw"
                        className="object-cover object-center z-[1]"
                    />}
                    {!firstTrending?.bannerImage && <Skeleton className={"z-0 h-full absolute w-full"}/>}
                    <div
                        className={"w-full z-[2] absolute bottom-0 h-[20rem] bg-gradient-to-t from-[--background-color] via-[--background-color] via-opacity-50 via-10% to-transparent"}
                    />
                    <div
                        className={"absolute bottom-16 right-8 z-[2] cursor-pointer opacity-80 transition-opacity hover:opacity-100"}
                        onClick={() => router.push(`/discover/search`)}>
                        <TextInput leftIcon={<FiSearch/>} value={"Search by genres, seasons…"} isReadOnly size={"lg"}
                                   className={"pointer-events-none w-96"} onChange={() => {
                        }}/>
                    </div>
                </div>
            </div>
            <div className={"px-4 pt-8 space-y-10 pb-10"}>
                <div className={"space-y-2"}>
                    <h2>Popular this season</h2>
                    <Slider
                        onSlideEnd={() => fetchNextTrending()}
                    >
                        {!trendingLoading ? trendingAnime?.pages?.flatMap(n => n.Page?.media).filter(Boolean).map(media => {
                            return (
                                <AnimeListItem
                                    key={media.id}
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
                                    key={media.id}
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
                    <h2>Upcoming</h2>
                    <Slider>
                        {!trendingUpcomingLoading ? trendingUpcomingAnime?.Page?.media?.filter(Boolean).map(media => {
                            return (
                                <AnimeListItem
                                    key={media.id}
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
                                    key={media.id}
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
        </>
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
