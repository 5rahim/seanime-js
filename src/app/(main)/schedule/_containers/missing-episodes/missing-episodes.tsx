"use client"
import React, { memo, useEffect } from "react"
import { LibraryEntry, useLibraryEntryAtoms } from "@/atoms/library/library-entry.atoms"
import { atom, Atom } from "jotai"
import { useSelectAtom } from "@/atoms/helpers"
import { MediaDownloadInfo, useMediaDownloadInfo } from "@/lib/download/helpers"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { IoLibrary } from "@react-icons/all-files/io5/IoLibrary"
import { LargeEpisodeListItem } from "@/components/shared/large-episode-list-item"
import { AiOutlineDownload } from "@react-icons/all-files/ai/AiOutlineDownload"
import { useRouter } from "next/navigation"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { withImmer } from "jotai-immer"
import { useAtom, useSetAtom } from "jotai/react"
import { Slider } from "@/components/shared/slider"


const __missingEpisodesAtom = atom<{ media: AnilistShowcaseMedia, downloadInfo: MediaDownloadInfo }[]>([])
export const missingEpisodesAtom = withImmer(__missingEpisodesAtom)
export const missingEpisodeCountAtom = atom(get => get(__missingEpisodesAtom).flatMap(n => n.downloadInfo.episodeNumbers).length)

export function MissingEpisodes() {

    const entryAtoms = useLibraryEntryAtoms()

    const [missing, setter] = useAtom(missingEpisodesAtom)

    useEffect(() => {
        return () => setter([])
    }, [])

    const { data, isLoading } = useQuery({
        queryKey: ["missed-episode-data", missing],
        queryFn: async () => {
            const result = await Promise.allSettled(
                missing.map(n => axios.get<AniZipData>("https://api.ani.zip/mappings?anilist_id=" + Number(n.media.id))),
            )
            const usable = result.filter(n => n.status === "fulfilled").map(n => (n as any).value.data as AniZipData)
            console.log(result, usable)
            return usable
        },
        keepPreviousData: false,
        enabled: missing.length > 0,
        refetchInterval: 1000 * 60,
    })

    return (
        <>
            {missing.length > 0 && <>
                <AppLayoutStack spacing={"lg"}>

                    <h2 className={"flex gap-3 items-center"}><IoLibrary/> Missing from your library</h2>

                    <Slider>
                        {!isLoading && missing.map(n => {
                            return n.downloadInfo.episodeNumbers.map(ep => {
                                return <EpisodeItem
                                    key={`${n.media.id}${ep}`}
                                    media={n.media}
                                    episodeNumber={ep}
                                    aniZipData={data?.find(k => k?.mappings?.anilist_id === n.media.id)}
                                />
                            })
                        })}
                        {isLoading && missing.map(n => n.downloadInfo.episodeNumbers.map(k => (
                            <Skeleton
                                className={"rounded-md h-auto overflow-hidden aspect-[4/2] w-96 relative flex items-end flex-none"}
                            />
                        )))}
                    </Slider>


                </AppLayoutStack>
            </>}
            {/*Hidden*/}
            {entryAtoms.map(entryAtom => {
                return <MissingEpisodesLoader key={`${entryAtom}`} entryAtom={entryAtom}/>
            })}
        </>
    )
}

type Props = {
    entryAtom: Atom<LibraryEntry>
}

export function MissingEpisodesLoader(props: Props) {
    const media = useSelectAtom(props.entryAtom, entry => entry.media)
    const setter = useSetAtom(missingEpisodesAtom)

    const { downloadInfo } = useMediaDownloadInfo(media)

    useEffect(() => {
        setter(draft => {
            const idx = draft?.findIndex(n => n.media.id === media.id)
            if (idx === -1 && downloadInfo.episodeNumbers.length > 0) {
                draft?.push({
                    media,
                    downloadInfo,
                })
            }
            if (idx !== -1 && downloadInfo.episodeNumbers.length === 0) {
                draft.splice(idx, 1)
            }
            return
        })
        // return () => setter([])
    }, [])

    return null
}


type EpisodeItemProps = {
    media: AnilistShowcaseMedia
    episodeNumber: number
    aniZipData?: AniZipData
}

const EpisodeItem = memo(({ media, episodeNumber, aniZipData }: EpisodeItemProps) => {

    const episodeData = aniZipData?.episodes?.[String(episodeNumber)]

    const router = useRouter()

    const date = episodeData?.airdate ? new Date(episodeData?.airdate) : undefined

    return (
        <>
            <LargeEpisodeListItem
                image={episodeData?.image || media.bannerImage}
                title={`Episode ${episodeNumber}`}
                topTitle={media.title?.userPreferred}
                meta={(date) ? `Aired ${formatDistanceToNow(date, { addSuffix: true })}` : undefined}
                actionIcon={<AiOutlineDownload/>}
                onClick={() => {
                    router.push(`/view/${media.id}?download=${episodeNumber}`)
                }}
            />
        </>
    )
})
