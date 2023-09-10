"use client"
import React, { useEffect, useMemo } from "react"
import { useAtomValue, useSetAtom } from "jotai/react"
import { LibraryEntry, libraryEntryAtoms } from "@/atoms/library/library-entry.atoms"
import { atom, Atom } from "jotai"
import { Slider } from "@/components/shared/slider"
import { useSelectAtom } from "@/atoms/helpers"
import { useMediaDownloadInfo } from "@/lib/download/helpers"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { formatDistanceToNow } from "date-fns"
import { useMount } from "react-use"
import { useRefreshAnilistCollection } from "@/atoms/anilist/collection.atoms"
import { Skeleton } from "@/components/ui/skeleton"
import { IoLibrary } from "@react-icons/all-files/io5/IoLibrary"
import { AiFillPlayCircle } from "@react-icons/all-files/ai/AiFillPlayCircle"
import { LargeEpisodeListItem } from "@/components/shared/large-episode-list-item"
import { AiOutlineDownload } from "@react-icons/all-files/ai/AiOutlineDownload"
import { useRouter } from "next/navigation"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { useLastMainLocalFileByMediaId } from "@/atoms/library/local-file.atoms"

type Props = {}

const _upToDateAtom = atom<boolean | null>(null)

export function MissedEpisodes(props: Props) {

    const entryAtoms = useAtomValue(libraryEntryAtoms)
    const refetchCollection = useRefreshAnilistCollection()

    const upToDate = useAtomValue(_upToDateAtom)

    useMount(() => {
        refetchCollection({ muteAlert: true })
    })

    // 1. currently watching
    // 2. Map them in subcomponents, useDownloadPageData() for each and list new episodes (either not-watched or un-downloaded) with download button

    return (
        <AppLayoutStack spacing={"lg"}>
            <h2 className={"flex gap-3 items-center"}><AiFillPlayCircle/> Next up</h2>
            <Slider>
                {entryAtoms.map(entryAtom => {
                    return <MissedEpisodesFromMedia key={`${entryAtom}`} entryAtom={entryAtom} type={"not-watched"}/>
                })}
            </Slider>
            <h2 className={"flex gap-3 items-center"}><IoLibrary/> Missing from your library</h2>
            {(!upToDate) && <Slider>
                {entryAtoms.map(entryAtom => {
                    return <MissedEpisodesFromMedia key={`${entryAtom}`} entryAtom={entryAtom} type={"not-downloaded"}/>
                })}
            </Slider>}
            {upToDate === true && (
                <div
                    className={"rounded-md h-auto bg-gray-900 overflow-hidden aspect-[4/2] w-96 relative flex items-center justify-center flex-none"}>
                    <p className={"font-semibold"}>You are up to date!</p>
                </div>
            )}
        </AppLayoutStack>
    )
}

type MissedEpisodesFromMediaProps = {
    entryAtom: Atom<LibraryEntry>
    type: "not-watched" | "not-downloaded"
}

export function MissedEpisodesFromMedia(props: MissedEpisodesFromMediaProps) {

    const media = useSelectAtom(props.entryAtom, entry => entry.media)
    const currentlyWatching = useSelectAtom(props.entryAtom, entry => entry.collectionEntry?.status === "CURRENT")
    const progress = useSelectAtom(props.entryAtom, entry => entry.collectionEntry?.progress)

    const lastFile = useLastMainLocalFileByMediaId(media.id)

    const upToDate = useSetAtom(_upToDateAtom)

    const nextEpisode = useMemo(() => {
        if (currentlyWatching && progress) {
            const availableEp = media?.nextAiringEpisode?.episode ? media?.nextAiringEpisode?.episode - 1 : media.episodes!
            // const missed = availableEp-progress
            if (availableEp > progress && lastFile?.metadata?.episode && progress + 1 <= lastFile.metadata.episode) {
                return progress + 1
            }
        }
        return undefined
    }, [media, currentlyWatching, progress])

    const {
        downloadInfo,
    } = useMediaDownloadInfo(media)

    const eps = [...downloadInfo.episodeNumbers, nextEpisode].filter(Boolean)

    const { data, isLoading } = useQuery({
        queryKey: ["missed-episode-data", media.id, nextEpisode, downloadInfo.episodeNumbers],
        queryFn: async () => {
            await new Promise((acc) => setTimeout(() => acc(""), 2000))
            const { data } = await axios.get<AniZipData>("https://api.ani.zip/mappings?anilist_id=" + Number(media.id))
            return data
        },
        keepPreviousData: false,
        enabled: eps.length > 0,
    })

    useEffect(() => {
        if (props.type === "not-downloaded" && !isLoading && downloadInfo.episodeNumbers.length > 0) upToDate(false)
    }, [isLoading])

    if (eps.length === 0
        || (props.type === "not-downloaded" && downloadInfo.episodeNumbers.length === 0)
        || (props.type === "not-watched" && !nextEpisode)
    ) return null


    return !isLoading ? (
        <>
            {props.type === "not-watched" ? (
                <EpisodeItem
                    key={`${media.id}${nextEpisode}`}
                    media={media}
                    episodeNumber={nextEpisode!}
                    aniZipData={data}
                    type={props.type}
                />
            ) : downloadInfo.episodeNumbers.sort((a, b) => a - b).map(ep => (
                <EpisodeItem
                    key={`${media.id}${ep}`}
                    media={media}
                    episodeNumber={ep}
                    aniZipData={data}
                    type={props.type}
                />
            ))}
        </>
    ) : (
        <>
            <Skeleton
                className={"rounded-md h-auto overflow-hidden aspect-[4/2] w-96 relative flex items-end flex-none"}/>
        </>
    )
}

type EpisodeItemProps = {
    media: AnilistShowcaseMedia
    episodeNumber: number
    aniZipData?: AniZipData
    type: "not-watched" | "not-downloaded"
}

function EpisodeItem({ media, episodeNumber, aniZipData, type }: EpisodeItemProps) {

    const episodeData = aniZipData?.episodes?.[String(episodeNumber)]

    const router = useRouter()

    const date = episodeData?.airdate ? new Date(episodeData?.airdate) : undefined

    return (
        <>
            <LargeEpisodeListItem
                image={episodeData?.image || media.bannerImage}
                title={`Episode ${episodeNumber}`}
                topTitle={media.title?.userPreferred}
                meta={(date && type === "not-downloaded") ? `Aired ${formatDistanceToNow(date, { addSuffix: true })}` : undefined}
                actionIcon={type === "not-downloaded" ? <AiOutlineDownload/> : undefined}
                onClick={() => {
                    if (type === "not-downloaded") {
                        router.push(`/view/${media.id}?download=${episodeNumber}`)
                    }
                    if (type === "not-watched") {
                        router.push(`/view/${media.id}?playNext=true`)
                    }
                }}
            />
        </>
    )
}
