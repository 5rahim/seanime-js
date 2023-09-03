"use client"
import React, { useEffect } from "react"
import Link from "next/link"
import { IconButton } from "@/components/ui/button"
import { AiOutlineArrowLeft } from "@react-icons/all-files/ai/AiOutlineArrowLeft"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useAtomValue } from "jotai/react"
import { ConsumetAnimeEpisode } from "@/lib/consumet/types"
import { EpisodeItemSkeleton } from "@/app/(main)/(library)/view/[id]/_components/episodes/episode-item"
import { streamingProviderAtom } from "@/atoms/streaming/streaming.atoms"
import { useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist/entries.atoms"
import { useStableSelectAtom } from "@/atoms/helpers"

interface WatchPageProps {
    children?: React.ReactNode
    media: AnilistDetailedMedia
    aniZipData: AniZipData
    episodeNumber: number
    episodes: ConsumetAnimeEpisode[]
}

export function WatchPage(props: WatchPageProps) {

    const { children, media, aniZipData, episodeNumber, episodes, ...rest } = props

    /** AniList **/
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(media.id)
    const progress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress)

    /** Streaming **/
    const streamingProvider = useAtomValue(streamingProviderAtom)

    useEffect(() => {
        console.log(streamingProvider)
    }, [streamingProvider])


    return (
        <>
            <div
                className={"col-span-5 h-[fit-content] 2xl:sticky top-[5rem]"}
            >
                <div className={"flex gap-4 items-center"}>
                    <Link href={`/view/${media.id}/${episodeNumber}`}>
                        <IconButton icon={<AiOutlineArrowLeft/>} rounded intent={"white-outline"} size={"md"}/>
                    </Link>
                    <h3>{media.title?.userPreferred}</h3>
                </div>
                Here {episodeNumber}
            </div>

            <div
                className={"col-span-3 relative space-y-4 h-[calc(100vh-10rem)] overflow-y-auto p-4 pt-2 mt-4 scrolling-touch"}
            >
                {episodes.map((episode, idx) => {
                    return (
                        <Link
                            key={episode.id + idx + episode.title}
                            href={`/watch/${media.id}/${streamingProvider}/${episode.number}`}
                            className={"block"}
                            id={String(episode.number)}
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
                        </Link>
                    )
                })}
                {/*{episodeData.loading && <>*/}
                {/*    <Skeleton className={"h-[130px] rounded-md"}/>*/}
                {/*    <Skeleton className={"h-[130px] rounded-md"}/>*/}
                {/*    <Skeleton className={"h-[130px] rounded-md"}/>*/}
                {/*    <Skeleton className={"h-[130px] rounded-md"}/>*/}
                {/*    <Skeleton className={"h-[130px] rounded-md"}/>*/}
                {/*    <Skeleton className={"h-[130px] rounded-md"}/>*/}
                {/*    <Skeleton className={"h-[130px] rounded-md"}/>*/}
                {/*    <Skeleton className={"h-[130px] rounded-md"}/>*/}
                {/*    <Skeleton className={"h-[130px] rounded-md"}/>*/}
                {/*    <Skeleton className={"h-[130px] rounded-md"}/>*/}
                {/*    <Skeleton className={"h-[130px] rounded-md"}/>*/}
                {/*    <Skeleton className={"h-[130px] rounded-md"}/>*/}
                {/*</>}*/}
                <div
                    className={"z-[5] sticky -bottom-4 w-full h-[8rem] bg-gradient-to-t from-[#121212] to-transparent"}
                />
            </div>
        </>
    )

}
