"use client"
import React, { startTransition, useEffect, useState } from "react"
import Link from "next/link"
import { Button, IconButton } from "@/components/ui/button"
import { AiOutlineArrowLeft } from "@react-icons/all-files/ai/AiOutlineArrowLeft"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useAtom, useAtomValue, useSetAtom } from "jotai/react"
import { consumetGogoAnimeServers, consumetZoroServers } from "@/lib/consumet/types"
import {
    getStreamPlaybackPositionAtom,
    gogoAnimeStreamingServerAtom,
    streamingAutoplayAtom,
    streamingProviderAtom,
    useStreamingPlaybackPosition,
    zoroStreamingServerAtom,
} from "@/atoms/streaming/streaming.atoms"
import { useAnilistCollectionEntryAtomByMediaId, useWatchedAnilistEntry } from "@/atoms/anilist/entries.atoms"
import { useStableSelectAtom } from "@/atoms/helpers"
import { useRouter, useSearchParams } from "next/navigation"
import { atom } from "jotai"
import { useMount, useUpdateEffect } from "react-use"
import { Select } from "@/components/ui/select"
import { atomWithStorage } from "jotai/utils"
import { VideoStreamer } from "@/lib/streaming/streamer"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { FiPlayCircle } from "@react-icons/all-files/fi/FiPlayCircle"
import { useEpisodeStreamingData, useProviderEpisodes, useSkipData } from "@/app/(main)/watch/_lib/queries"

import { EpisodeListItem } from "@/components/shared/episode-list-item"
import { LuffyError } from "@/components/shared/luffy-error"
import { AniZipData } from "@/lib/anizip/types"

interface WatchPageProps {
    children?: React.ReactNode
    media: AnilistDetailedMedia
    aniZipData?: AniZipData
}

/** Persist the current episode number **/
const episodeNumberRepositoryAtom = atomWithStorage<{
    mediaId: number,
    episodeNumber: number
} | null>("sea-streaming-episode-number-repository", null, undefined, { unstable_getOnInit: true })

const episodeNumberAtom = atom<number>(1)


export function WatchPage(props: WatchPageProps) {

    const { children, media, aniZipData, ...rest } = props

    const router = useRouter()
    const searchParams = useSearchParams()
    const navigationEpisodeNumber = searchParams.get("episode") ? Number(searchParams.get("episode")) : undefined

    const maxEp = media.nextAiringEpisode?.episode ? (media.nextAiringEpisode?.episode - 1) : media.episodes!

    /** Update progress **/
    const [showProgressButton, toggleProgressButton] = useState(false)
    const { watchedEntry } = useWatchedAnilistEntry()

    /** AniList **/
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(media.id)
    const progress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress)

    /** Streaming **/
    const autoplay = useAtomValue(streamingAutoplayAtom)
    const [episodeNumber, setEpisodeNumber] = useAtom(episodeNumberAtom)
    const [episodeNumberRepository, setEpisodeNumberRepository] = useAtom(episodeNumberRepositoryAtom)
    const currentEpisodeNumberFromRepository = (!!episodeNumberRepository && episodeNumberRepository?.mediaId === media.id) ? episodeNumberRepository.episodeNumber : undefined


    /** Streaming provider/server **/
    const [streamingProvider, setStreamingProvider] = useAtom(streamingProviderAtom)
    const [zoroServer, setZoroServer] = useAtom(zoroStreamingServerAtom)
    const [gogoAnimeServer, setGogoAnimeServer] = useAtom(gogoAnimeStreamingServerAtom)

    const server = streamingProvider === "gogoanime" ? gogoAnimeServer : zoroServer

    /** Playback position **/
    const { updatePlaybackPosition, cleanPlaybackPosition } = useStreamingPlaybackPosition()
    const getStoredPlaybackPosition = useSetAtom(getStreamPlaybackPositionAtom)

    useMount(() => {
        const ep = navigationEpisodeNumber || currentEpisodeNumberFromRepository || 1
        setEpisodeNumber(ep)
        router.push(`/watch/${media.id}`) // Will remove `?episode=` on landing
    })

    /** AniSkip **/
    const { data: aniSkipData } = useSkipData(media.idMal, episodeNumber)


    /** Update episode number **/
    useUpdateEffect(() => {
        setEpisodeNumberRepository({ mediaId: media.id, episodeNumber })
    }, [episodeNumber])

    /** Get episode data from all providers **/
    const {
        data: providerEpisodeData,
        isLoading: providerEpisodeDataLoading,
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

    /** Scroll to selected episode element when the episode list changes (on mount) **/
    useEffect(() => {
        startTransition(() => {
            const element = document.getElementById(`episode-${episodeNumber}`)
            if (element) {
                element.scrollIntoView({ behavior: "smooth" })
            }
        })
    }, [episodes, episodeNumber])


    function goToNextEpisode() {
        setEpisodeNumber(ep => {
            return ep + 1 < maxEp ? ep + 1 : ep
        })
    }

    if (providerEpisodeDataLoading) return <>
        <div className={"col-span-1 2xl:col-span-8 w-full pr-4"}>
            <Skeleton className={"w-full h-10"}/>
        </div>
        <div className={"relative col-span-1 2xl:col-span-5 w-full h-full"}>
            <Skeleton className={"aspect-video h-auto w-full"}/>
        </div>
        <div className={"relative col-span-1 2xl:col-span-3 p-4 pt-0 space-y-4"}>
            <EpisodeListSkeleton/>
        </div>
    </>

    if ((!providerEpisodeData || providerEpisodeData.length === 0) && !providerEpisodeDataLoading) return <>
        <div className={"col-span-full flex gap-4 items-center relative"}>
            <Link href={`/view/${media.id}`}>
                <IconButton icon={<AiOutlineArrowLeft/>} rounded intent={"white-outline"} size={"md"}/>
            </Link>
            <h3>{media.title?.userPreferred}</h3>
        </div>
        <LuffyError className={"col-span-full"}>
            Something went wrong! Verify your Consumet API.
        </LuffyError>
    </>


    return (
        <>
            <div className={"col-span-1 2xl:col-span-full flex gap-4 items-center relative"}>
                <Link href={`/view/${media.id}`}>
                    <IconButton icon={<AiOutlineArrowLeft/>} rounded intent={"white-outline"} size={"md"}/>
                </Link>
                <h3>{media.title?.userPreferred}</h3>
                {(showProgressButton && (!progress || progress < episodeNumber) && progress !== maxEp) && (
                    <div className={"absolute right-6 z-[5]"}>
                        <Button
                            intent={"success"}
                            className={"animate-bounce"}
                            onClick={() => {
                                toggleProgressButton(false)
                                watchedEntry({
                                    mediaId: media.id,
                                    episode: episodeNumber || 1,
                                })
                                goToNextEpisode()
                            }}
                        >
                            Update progress ({episodeNumber}/{maxEp})
                        </Button>
                    </div>
                )}
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
                    <div className={"relative"}>
                        <div className={"aspect-video w-full"}>
                            <VideoStreamer
                                id={episodeMeta?.id || ""}
                                title={`Episode ${episodeNumber}`}
                                data={episodeStreamingData}
                                provider={streamingProvider}
                                skip={aniSkipData}
                                poster={media.bannerImage}
                                onVideoComplete={() => {
                                    if (!progress || progress < episodeNumber) {
                                        toggleProgressButton(true)
                                    }
                                    console.log("video completed")
                                }}
                                onVideoEnd={() => {
                                    console.log("video ended")
                                    if (autoplay) {
                                        startTransition(() => {
                                            goToNextEpisode()
                                        })
                                    }
                                }}
                                onTick={(status) => {
                                    updatePlaybackPosition({
                                        id: `${media.id}/${episodeNumber}`,
                                        position: status.position,
                                        duration: status.duration,
                                    })
                                    // console.log(status)

                                }}
                                onCleanPlaybackPosition={() => {
                                    cleanPlaybackPosition({ id: `${media.id}/${episodeNumber}` })
                                }}
                                storedPlaybackPosition={getStoredPlaybackPosition(`${media.id}/${episodeNumber}`)}
                            />
                        </div>
                    </div>
                )}
                <div className={"flex flex-col xl:flex-row items-center w-full justify-between gap-4"}>
                    <div className={"w-fit flex-none"}>
                        <h3 className={"flex-none"}>
                            {`Episode ${episodeNumber}`}
                        </h3>
                    </div>
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
                            <EpisodeListItem
                                title={`Episode ${episode.number}`}
                                episodeTitle={`${episode.title}`}
                                description={episode.description ?? undefined}
                                image={episode.image}
                                media={media}
                                isSelected={episode.number === episodeNumber}
                                unoptimizedImage={episodes.length > 200}
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
