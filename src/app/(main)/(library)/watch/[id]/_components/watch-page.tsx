"use client"
import React, { startTransition, useEffect } from "react"
import Link from "next/link"
import { IconButton } from "@/components/ui/button"
import { AiOutlineArrowLeft } from "@react-icons/all-files/ai/AiOutlineArrowLeft"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useAtom } from "jotai/react"
import {
    ConsumetAnimeEpisodeMeta,
    consumetGogoAnimeServers,
    ConsumetProvider,
    consumetZoroServers,
} from "@/lib/consumet/types"
import { EpisodeItemSkeleton } from "@/app/(main)/(library)/view/[id]/_components/episodes/episode-item"
import {
    gogoAnimeStreamingServerAtom,
    streamingProviderAtom,
    zoroStreamingServerAtom,
} from "@/atoms/streaming/streaming.atoms"
import { useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist/entries.atoms"
import { useStableSelectAtom } from "@/atoms/helpers"
import { useRouter, useSearchParams } from "next/navigation"
import { atom } from "jotai"
import { useMount, useUpdateEffect } from "react-use"
import { getConsumetEpisodeMeta, getConsumetEpisodeStreamingData } from "@/lib/consumet/actions"
import { Select } from "@/components/ui/select"
import { atomWithStorage } from "jotai/utils"
import { VideoStreamer } from "@/lib/streaming/streamer"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { FiPlayCircle } from "@react-icons/all-files/fi/FiPlayCircle"
import { SkipTime } from "@/lib/aniskip/types"

interface WatchPageProps {
    children?: React.ReactNode
    media: AnilistDetailedMedia
    aniZipData: AniZipData
    // episodes: ConsumetAnimeEpisode[]
}

/** Persist the current episode number **/
const episodeNumberRepositoryAtom = atomWithStorage<{
    mediaId: number,
    episodeNumber: number
} | null>("sea-streaming-episode-number-repository", null, undefined, { unstable_getOnInit: true })

const episodeNumberAtom = atom<number>(1)


export function useEpisodeStreamingData(episodes: ConsumetAnimeEpisodeMeta[], episodeNumber: number, provider: ConsumetProvider, server: any | undefined) {
    const episodeId = episodes.find(episode => episode.number === episodeNumber)?.id
    const res = useQuery(
        ["episode-streaming-data", episodes, episodeNumber, server || "-"],
        async () => {
            return await getConsumetEpisodeStreamingData(episodeId!, provider, server, false)
        },
        { enabled: !!episodeId, retry: false, keepPreviousData: false, refetchOnWindowFocus: false },
    )
    return { data: res.data, isLoading: res.isLoading || res.isFetching, isError: res.isError }
}

export function useProviderEpisodes(mediaId: number, server: any) {
    const res = useQuery(
        ["episode-data", mediaId, server],
        async () => {
            return await getConsumetEpisodeMeta(mediaId, server, false)
        },
        { keepPreviousData: false, refetchOnWindowFocus: false },
    )
    return { data: res.data, isLoading: res.isLoading || res.isFetching, isError: res.isError }
}

export function useSkipData(mediaMalId: number | null | undefined, episodeNumber: number) {
    const res = useQuery(
        ["skip-data", mediaMalId, episodeNumber],
        async () => {
            const result = await fetch(
                `https://api.aniskip.com/v2/skip-times/${mediaMalId}/${episodeNumber}?types[]=ed&types[]=mixed-ed&types[]=mixed-op&types[]=op&types[]=recap&episodeLength=`,
            )
            const skip = (await result.json()) as { found: boolean, results: SkipTime[] }
            if (!!skip.results && skip.found) return {
                op: skip.results?.find((item) => item.skipType === "op") || null,
                ed: skip.results?.find((item) => item.skipType === "ed") || null,
            }
            return { op: null, ed: null }
        },
        { keepPreviousData: false, refetchOnWindowFocus: false, enabled: !!mediaMalId },
    )
    return { data: res.data, isLoading: res.isLoading || res.isFetching, isError: res.isError }
}

export function WatchPage(props: WatchPageProps) {

    const { children, media, aniZipData, ...rest } = props

    const router = useRouter()
    const searchParams = useSearchParams()
    const navigationEpisodeNumber = searchParams.get("episode") ? Number(searchParams.get("episode")) : undefined

    /** AniList **/
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(media.id)
    const progress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress)

    /** Streaming **/
        // const [episodes, setEpisodes] = useAtom(episodesAtom)
    const [episodeNumber, setEpisodeNumber] = useAtom(episodeNumberAtom)
    const [episodeNumberRepository, setEpisodeNumberRepository] = useAtom(episodeNumberRepositoryAtom)
    const currentEpisodeNumberFromRepository = (!!episodeNumberRepository && episodeNumberRepository?.mediaId === media.id) ? episodeNumberRepository.episodeNumber : undefined


    /** Streaming provider/server **/
    const [streamingProvider, setStreamingProvider] = useAtom(streamingProviderAtom)
    const [zoroServer, setZoroServer] = useAtom(zoroStreamingServerAtom)
    const [gogoAnimeServer, setGogoAnimeServer] = useAtom(gogoAnimeStreamingServerAtom)

    const server = streamingProvider === "gogoanime" ? gogoAnimeServer : zoroServer

    useMount(() => {
        const ep = navigationEpisodeNumber || currentEpisodeNumberFromRepository || 1
        setEpisodeNumber(ep)
        router.push(`/watch/${media.id}`) // Will remove `?episode=` on landing
    })

    /** AniSkip **/
    const { data: aniSkipData } = useSkipData(media.idMal, episodeNumber)

    useEffect(() => {
        console.log(aniSkipData)
    }, [aniSkipData])

    /** Update episode number **/
    useUpdateEffect(() => {
        setEpisodeNumberRepository({ mediaId: media.id, episodeNumber })
    }, [episodeNumber])

    /** Get episode data from all providers **/
    const {
        data: providerEpisodeData,
        isLoading: providerEpisodeDataLoading,
        isError: providerEpisodeDataError,
    } = useProviderEpisodes(media.id, server)

    /** Derived **/
    const episodes = providerEpisodeData?.find(n => n.provider === streamingProvider)?.episodes ?? []
    const episodeMeta = episodes.find(episode => episode.number === episodeNumber)

    /** Retrieve streaming data depending on provider and episode ID **/
    const {
        data: episodeStreamingData,
        isLoading: episodeStreamingDataLoading,
        isError: episodeStreamingDataError,
    } = useEpisodeStreamingData(episodes, episodeNumber, streamingProvider, server)

    useEffect(() => {
        console.log(episodeStreamingData, episodeStreamingDataError)
    }, [episodeStreamingData, episodeStreamingDataError])

    /** Scroll to selected episode element when the episode list changes (on mount) **/
    useEffect(() => {
        startTransition(() => {
            const element = document.getElementById(`episode-${episodeNumber}`)
            if (element) {
                element.scrollIntoView({ behavior: "smooth" })
            }
        })
    }, [episodes, episodeNumber])

    if (providerEpisodeDataLoading) return <>
        <Skeleton className={"col-span-1 2xl:col-span-8 w-full h-10 mr-4"}/>
        <div className={"relative col-span-1 2xl:col-span-5 w-full h-full"}>
            <Skeleton className={"aspect-video h-auto w-full"}/>
        </div>
        <div className={"relative col-span-1 2xl:col-span-3 p-4 pt-0 space-y-4"}>
            <EpisodeListSkeleton/>
        </div>
    </>


    return (
        <>
            <div className={"col-span-1 2xl:col-span-8 flex gap-4 items-center"}>
                <Link href={`/view/${media.id}`}>
                    <IconButton icon={<AiOutlineArrowLeft/>} rounded intent={"white-outline"} size={"md"}/>
                </Link>
                <h3>{media.title?.userPreferred}</h3>
            </div>

            <div
                className={"col-span-1 2xl:col-span-5 h-[fit-content] 2xl:sticky top-[5rem] space-y-4"}
            >

                {episodeStreamingDataLoading && <div className={"relative h-full w-full"}>
                    <Skeleton className={"aspect-video h-auto w-full"}/>
                </div>}

                {(episodeStreamingDataError || (!episodeStreamingData && !episodeStreamingDataLoading)) && <div
                    className={"aspect-video w-full relative flex flex-col justify-center items-center rounded-md bg-gray-800"}>
                    {<div
                        className="h-[15rem] w-[15rem] mx-auto flex-none rounded-md object-cover object-center relative overflow-hidden">
                        <Image
                            src={"/luffy-01.png"}
                            alt={""}
                            fill
                            quality={100}
                            priority
                            sizes="10rem"
                            className="object-contain object-top"
                        />
                    </div>}
                    <h3 className={"mt-4"}>Could not find the video source</h3>
                </div>}

                {(!episodeStreamingDataError && !episodeStreamingDataLoading && !!episodeStreamingData) && (
                    <div>
                        <div className={"aspect-video w-full"}>
                            <VideoStreamer
                                id={episodeMeta?.id || ""}
                                title={`Episode ${episodeNumber}`}
                                data={episodeStreamingData}
                                provider={streamingProvider}
                                skip={aniSkipData}
                                poster={media.bannerImage}
                                aniId={media.id}
                            />
                        </div>
                    </div>
                )}
                <div className={"flex gap-4 w-full justify-end"}>
                    <Select
                        options={episodes.map(episode => ({
                            label: `Episode ${episode.number}`,
                            value: String(episode.number),
                        }))}
                        fieldClassName={"flex items-center gap-4 w-auto space-y-0"}
                        fieldLabelClassName={"self-center"}
                        value={String(episodeNumber)}
                        onChange={e => setEpisodeNumber(Number(e.target.value))}
                        leftIcon={<FiPlayCircle/>}
                    />
                    <Select
                        label={"Provider"}
                        options={[
                            { value: "gogoanime", label: "GogoAnime" },
                            { value: "zoro", label: "AniWatch" },
                        ]}
                        fieldClassName={"flex items-center gap-4 w-auto space-y-0"}
                        fieldLabelClassName={"self-center"}
                        value={streamingProvider}
                        onChange={e => setStreamingProvider(e.target.value as any)}
                    />
                    <Select
                        label={"Server"}
                        options={streamingProvider === "gogoanime" ? consumetGogoAnimeServers.map(n => ({ value: n })) : consumetZoroServers.map(n => ({ value: n }))}
                        fieldClassName={"flex items-center gap-4 w-auto space-y-0"}
                        fieldLabelClassName={"self-center"}
                        value={streamingProvider === "gogoanime" ? gogoAnimeServer : zoroServer}
                        onChange={e => {
                            if (streamingProvider === "gogoanime")
                                setGogoAnimeServer(e.target.value as any)
                            if (streamingProvider === "zoro")
                                setZoroServer(e.target.value as any)
                        }}
                    />
                </div>
                {/*<pre>{JSON.stringify(episodeStreamingData, null, 2)}</pre>*/}

            </div>

            <div
                className={"col-span-1 2xl:col-span-3 relative space-y-4 h-[calc(100vh-15rem)] overflow-y-auto p-4 pt-0 scrolling-touch"}
            >
                {episodes.map((episode, idx) => {
                    return (
                        <div
                            key={episode.id + idx + episode.title}
                            className={"block cursor-pointer"}
                            id={`episode-${String(episode.number)}`}
                            onClick={() => setEpisodeNumber(episode.number)}
                        >
                            <EpisodeItemSkeleton
                                title={`Episode ${episode.number}`}
                                episodeTitle={`${episode.title}`}
                                description={episode.description ?? undefined}
                                image={episode.image}
                                media={media}
                                isSelected={episode.number === episodeNumber}
                                isWatched={progress ? episode.number <= progress : undefined}
                            />
                        </div>
                    )
                })}
                {providerEpisodeDataLoading && <>
                    <EpisodeListSkeleton/>
                </>}
                <div
                    className={"z-[5] sticky -bottom-4 w-full h-[8rem] bg-gradient-to-t from-[#121212] to-transparent"}
                />
            </div>
        </>
    )

}

export const EpisodeListSkeleton = () => {
    return (
        <>
            <Skeleton className={"h-[130px] rounded-md"}/>
            <Skeleton className={"h-[130px] rounded-md"}/>
            <Skeleton className={"h-[130px] rounded-md"}/>
            <Skeleton className={"h-[130px] rounded-md"}/>
            <Skeleton className={"h-[130px] rounded-md"}/>
        </>
    )
}
