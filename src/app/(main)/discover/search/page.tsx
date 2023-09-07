"use client"
import { AppLayoutGrid, AppLayoutStack } from "@/components/ui/app-layout"
import { FiSearch } from "@react-icons/all-files/fi/FiSearch"
import { TextInput } from "@/components/ui/text-input"
import React, { useEffect, useMemo, useState } from "react"
import { Select } from "@/components/ui/select"
import { getYear } from "date-fns"
import { ListAnimeDocument, MediaFormat, MediaSeason, MediaSort, MediaStatus } from "@/gql/graphql"
import { atomWithImmer } from "jotai-immer"
import { useMount, useUpdateEffect } from "react-use"
import { useAtom, useSetAtom } from "jotai/react"
import { MultiSelect } from "@/components/ui/multi-select"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeListItem } from "@/components/shared/anime-list-item"
import { cn } from "@/components/ui/core"
import { AiOutlinePlusCircle } from "@react-icons/all-files/ai/AiOutlinePlusCircle"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useDebounce } from "@/hooks/use-debounce"
import { IconButton } from "@/components/ui/button"
import { BiTrash } from "@react-icons/all-files/bi/BiTrash"
import _ from "lodash"
import { AiOutlineArrowLeft } from "@react-icons/all-files/ai/AiOutlineArrowLeft"
import Link from "next/link"

type Params = {
    active: boolean
    title: string | null
    sorting: MediaSort[] | null
    genre: string[] | null
    status: MediaStatus[] | null
    format: MediaFormat | null
    season: MediaSeason | null
    year: string | null
    minScore: string | null
}

const paramsAtom = atomWithImmer<Params>({
    active: false,
    title: null,
    sorting: null,
    status: null,
    genre: null,
    format: null,
    season: null,
    year: null,
    minScore: null,
})

function _getValue<T extends any>(value: T | ""): any {
    if (value === "") return undefined
    if (Array.isArray(value) && value.filter(Boolean).length === 0) return undefined
    if (typeof value === "string" && !isNaN(parseInt(value))) return Number(value)
    if (value === null) return undefined
    return value
}

export default function Page({ params: urlParams }: {
    params: {
        sorting?: MediaSort,
        genre?: string,
        format?: MediaFormat,
        season?: MediaSeason,
        status?: MediaStatus,
        year?: string
    }
}) {

    const [params, setParams] = useAtom(paramsAtom)

    useMount(() => {
        setParams({
            active: true,
            title: null,
            sorting: urlParams.sorting ? [urlParams.sorting] : null,
            status: urlParams.status ? [urlParams.status] : null,
            genre: urlParams.genre ? [urlParams.genre] : null,
            format: urlParams.format || null,
            season: urlParams.season || null,
            year: urlParams.year || null,
            minScore: null,
        })
    })

    // useEffect(() => {
    //     console.log(params)
    // }, [params])

    const {
        data: media, isLoading,
        fetchNextPage,
        isFetching,
        isFetchingNextPage,
        hasNextPage,
        status,
    } = useInfiniteQuery({
        queryKey: ["projects", params],
        queryFn: async ({ pageParam = 1 }) => {
            // console.log("pageParam", pageParam)
            const variables = {
                page: pageParam,
                perPage: 48,
                format: _getValue(params.format)?.toUpperCase(),
                search: (params.title === null || params.title === "") ? undefined : params.title,
                genres: _getValue(params.genre),
                season: _getValue(params.season),
                seasonYear: _getValue(params.year),
                averageScore_greater: _getValue(params.minScore) !== undefined ? _getValue(params.minScore) : undefined,
                sort: (params.title?.length && params.title.length > 0) ? ["SEARCH_MATCH", ...(_getValue(params.sorting) || ["SCORE_DESC"])] : (_getValue(params.sorting) || ["SCORE_DESC"]),
                status: params.sorting?.includes("START_DATE_DESC") ? (_getValue(params.status)?.filter((n: string) => n !== "NOT_YET_RELEASED") || ["FINISHED", "RELEASING"]) : _getValue(params.status),
            }
            console.log(variables)
            return useAniListAsyncQuery(ListAnimeDocument, variables)
        },
        getNextPageParam: (lastPage, pages) => {
            const curr = lastPage.Page?.pageInfo?.currentPage
            const hasNext = lastPage.Page?.pageInfo?.hasNextPage
            // console.log("lastPage", lastPage, "pages", pages, "curr", curr, "hasNext", hasNext, "nextPage", (!!curr && hasNext) ? pages.length + 1 : undefined)
            return (!!curr && hasNext) ? pages.length + 1 : undefined
        },
        keepPreviousData: false,
        enabled: params.active,
        refetchOnMount: true,
    })

    useEffect(() => {
        console.log(media?.pages.flatMap(n => n.Page?.media).filter(Boolean))
    }, [media])

    const title = useMemo(() => {
        if (params.title && params.title.length > 0) return _.startCase(params.title)
        if (!!_getValue(params.genre)) return params.genre?.join(", ")
        if (_getValue(params.sorting)?.includes("SCORE_DESC")) return "Most liked shows"
        if (_getValue(params.sorting)?.includes("TRENDING_DESC")) return "Trending"
        if (_getValue(params.sorting)?.includes("POPULARITY_DESC")) return "Popular"
        if (_getValue(params.sorting)?.includes("START_DATE_DESC")) return "Latest"
        if (_getValue(params.sorting)?.includes("EPISODES_DESC")) return "Most episodes"
        return "Most liked shows"
    }, [params])

    return (
        <AppLayoutStack spacing={"xl"} className={"mt-8 px-4 pb-10"}>
            <div className={"flex items-center gap-4"}>
                <Link href={`/discover`}>
                    <IconButton icon={<AiOutlineArrowLeft/>} rounded intent={"white-outline"} size={"sm"}/>
                </Link>
                <h3>Discover</h3>
            </div>
            <div className={"text-center xl:text-left"}>
                <h2>{title}</h2>
            </div>
            <AppLayoutGrid cols={6} spacing={"lg"}>
                <AppLayoutStack className={"px-4 xl:px-0"}>
                    <div className={"flex flex-row xl:flex-col gap-4"}>
                        <TitleInput/>
                        <Select
                            // label={"Sorting"}
                            className={"w-full"}
                            options={SORTING}
                            value={params.sorting || "SCORE_DESC"}
                            onChange={e => setParams(draft => {
                                draft.sorting = [e.target.value] as any
                                return
                            })}
                            isDisabled={!!params.title && params.title.length > 0}
                        />
                    </div>
                    <div className={"flex flex-row xl:flex-col gap-4 items-end xl:items-start"}>
                        <MultiSelect
                            label={"Genre"} placeholder={"All genres"} className={"w-full"}
                            options={MEDIA_GENRES.map(genre => ({ value: genre, label: genre }))}
                            value={params.genre ? params.genre : undefined}
                            onChange={e => setParams(draft => {
                                draft.genre = e
                                return
                            })}
                        />
                        <Select
                            label={"Format"} placeholder={"All formats"} className={"w-full"}
                            options={FORMATS}
                            value={params.format || ""}
                            onChange={e => setParams(draft => {
                                draft.format = e.target.value as any
                                return
                            })}
                        />
                        <Select
                            label={"Season"} placeholder={"All seasons"} className={"w-full"}
                            options={SEASONS.map(season => ({ value: season.toUpperCase(), label: season }))}
                            value={params.season || ""}
                            onChange={e => setParams(draft => {
                                draft.season = e.target.value as any
                                return
                            })}
                        />
                        <Select
                            label={"Year"} placeholder={"Timeless"} className={"w-full"}
                            options={[...Array(70)].map((v, idx) => getYear(new Date()) - idx).map(year => ({
                                value: String(year),
                                label: String(year),
                            }))}
                            value={params.year || ""}
                            onChange={e => setParams(draft => {
                                draft.year = e.target.value as any
                                return
                            })}
                        />
                        <Select
                            label={"Status"} placeholder={"All"} className={"w-full"}
                            options={STATUS}
                            value={params.status || ""}
                            onChange={e => setParams(draft => {
                                draft.status = [e.target.value] as any
                                return
                            })}
                        />
                        <IconButton icon={<BiTrash/>} intent={"gray-subtle"} className={"flex-none"} onClick={() => {
                            setParams({
                                active: true,
                                title: null,
                                sorting: null,
                                status: null,
                                genre: null,
                                format: null,
                                season: null,
                                year: null,
                                minScore: null,
                            })
                        }}/>
                    </div>
                    {/*<Select*/}
                    {/*    label={"Minimum score"} placeholder={"No preference"} className={"w-full"}*/}
                    {/*    options={[...Array(9)].map((v, idx) => 9 - idx).map(score => ({*/}
                    {/*        value: String(score),*/}
                    {/*        label: String(score),*/}
                    {/*    }))}*/}
                    {/*    value={params.minScore || ""}*/}
                    {/*    onChange={e => setParams(draft => {*/}
                    {/*        draft.minScore = e.target.value as any*/}
                    {/*        return*/}
                    {/*    })}*/}
                    {/*/>*/}

                </AppLayoutStack>
                <div className={"col-span-5"}>
                    {!isLoading && <div
                        className={"px-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 min-[2000px]:grid-cols-8 gap-4"}>
                        {media?.pages.flatMap(n => n.Page?.media).filter(Boolean).map(media => (
                            <AnimeListItem key={`${media.id}`} mediaId={media.id} media={media}
                                           showLibraryBadge={true}/>
                        ))}
                        {((media?.pages.flatMap(n => n.Page?.media).filter(Boolean) || []).length > 0 && hasNextPage) &&
                            <div
                                className={cn(
                                    "h-full col-span-1 group/anime-list-item relative flex flex-col place-content-stretch rounded-md animate-none min-h-[348px]",
                                    "cursor-pointer border border-dashed border-[--border] border-none text-[--muted] hover:text-white pt-24 items-center gap-2 transition",
                                )}
                                onClick={() => fetchNextPage()}
                            >
                                <AiOutlinePlusCircle className={"text-4xl"}/>
                                <p className={"text-lg font-medium"}>Load more</p>
                            </div>}
                    </div>}
                    {isLoading && <LoadingSpinner/>}
                </div>
            </AppLayoutGrid>
        </AppLayoutStack>
    )
}

function TitleInput() {
    const [inputValue, setInputValue] = useState("")
    const debouncedTitle = useDebounce(inputValue, 500)
    const setParams = useSetAtom(paramsAtom)

    useUpdateEffect(() => {
        setParams(draft => {
            draft.title = debouncedTitle
            return
        })
    }, [debouncedTitle])

    return (
        <TextInput
            leftIcon={<FiSearch/>} placeholder={"Title"} className={"w-full"}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
        />
    )
}

const MEDIA_GENRES = [
    "Action",
    "Adventure",
    "Comedy",
    "Drama",
    "Ecchi",
    "Fantasy",
    "Horror",
    "Mahou Shoujo",
    "Mecha",
    "Music",
    "Mystery",
    "Psychological",
    "Romance",
    "Sci-Fi",
    "Slice of Life",
    "Sports",
    "Supernatural",
    "Thriller",
]

const SEASONS = [
    "Winter",
    "Spring",
    "Summer",
    "Fall",
]

const FORMATS: { value: MediaFormat, label: string }[] = [
    { value: "TV", label: "TV" },
    { value: "MOVIE", label: "Movie" },
    { value: "ONA", label: "ONA" },
    { value: "OVA", label: "OVA" },
    { value: "TV_SHORT", label: "TV Short" },
    { value: "SPECIAL", label: "Special" },
]

const STATUS = [
    { value: "FINISHED", label: "Finished" },
    { value: "RELEASING", label: "Airing" },
    { value: "NOT_YET_RELEASED", label: "Upcoming" },
    { value: "HIATUS", label: "Hiatus" },
    { value: "CANCELLED", label: "Cancelled" },
]

const SORTING = [
    { value: "TRENDING_DESC", label: "Trending" },
    { value: "START_DATE_DESC", label: "Release date" },
    { value: "SCORE_DESC", label: "Highest score" },
    { value: "POPULARITY_DESC", label: "Most popular" },
    { value: "EPISODES_DESC", label: "Number of episodes" },
]
