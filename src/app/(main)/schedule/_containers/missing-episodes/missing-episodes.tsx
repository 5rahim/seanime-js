"use client"
import React, { memo } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { Skeleton } from "@/components/ui/skeleton"
import { IoLibrary } from "@react-icons/all-files/io5/IoLibrary"
import { LargeEpisodeListItem } from "@/components/shared/large-episode-list-item"
import { AiOutlineDownload } from "@react-icons/all-files/ai/AiOutlineDownload"
import { useRouter } from "next/navigation"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { useAtomValue } from "jotai/react"
import { Slider } from "@/components/shared/slider"
import { missingEpisodesAtom } from "@/atoms/anilist/missing-episodes.atoms"
import { AniZipData } from "@/lib/anizip/types"

export function MissingEpisodes() {

    const missing = useAtomValue(missingEpisodesAtom)

    const { data, isLoading } = useQuery({
        queryKey: ["missed-episode-data", missing],
        queryFn: async () => {
            const result = await Promise.allSettled(
                missing.map(n => axios.get<AniZipData>("https://api.ani.zip/mappings?anilist_id=" + Number(n.media.id))),
            )
            return result.filter(n => n.status === "fulfilled").map(n => (n as any).value.data as AniZipData)
        },
        enabled: missing.length > 0,
        refetchInterval: 1000 * 60,
    })

    return (
        <>
            {missing.length > 0 && <AppLayoutStack spacing={"lg"}>

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
                            key={n.media.id + k}
                            className={"rounded-md h-auto overflow-hidden aspect-[4/2] w-96 relative flex items-end flex-none"}
                        />
                    )))}
                </Slider>
            </AppLayoutStack>}
        </>
    )
}


type EpisodeItemProps = {
    media: AnilistShowcaseMedia
    episodeNumber: number
    aniZipData?: AniZipData
}

const EpisodeItem = memo(({ media, episodeNumber, aniZipData }: EpisodeItemProps) => {

    const episodeData = aniZipData?.episodes?.[String(episodeNumber)]

    const router = useRouter()

    return (
        <>
            <LargeEpisodeListItem
                image={episodeData?.image || media.bannerImage}
                title={`Episode ${episodeNumber}`}
                topTitle={media.title?.userPreferred}
                meta={episodeData?.airdate ?? undefined}
                actionIcon={<AiOutlineDownload/>}
                onClick={() => {
                    router.push(`/view/${media.id}?download=${episodeNumber}`)
                }}
            />
        </>
    )
})