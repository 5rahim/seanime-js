"use client"
import React from "react"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useDownloadPageData } from "@/app/(main)/(library)/view/[id]/download/_components/use-download-page-data"
import { Divider } from "@/components/ui/divider"
import { EpisodeItemSkeleton } from "@/app/(main)/(library)/view/[id]/_components/episodes/episode-item"
import { BiCalendarAlt } from "@react-icons/all-files/bi/BiCalendarAlt"
import { BiDownload } from "@react-icons/all-files/bi/BiDownload"
import Link from "next/link"

interface UndownloadedEpisodeListProps {
    children?: React.ReactNode
    media: AnilistDetailedMedia
    aniZipData?: AniZipData
}

export const UndownloadedEpisodeList: React.FC<UndownloadedEpisodeListProps> = React.memo((props) => {

    const { children, media, aniZipData, ...rest } = props

    const {
        downloadInfo,
    } = useDownloadPageData(media)

    if (!aniZipData || (downloadInfo.toDownload === 0)) return null

    return (
        <>
            <Divider/>
            <div className={"space-y-2"}>
                <h3>Not downloaded</h3>
                <p className={"text-[--muted]"}>
                    {downloadInfo.rewatch ? "You have not downloaded the following" : "You have not watched nor downloaded the following"}
                </p>
            </div>
            <div className={"grid grid-cols-2 gap-4 opacity-60"}>
                {downloadInfo.episodeNumbers.map((epNumber, index) => {
                    const airDate = aniZipData?.episodes[String(epNumber)]?.airdate
                    return (
                        <EpisodeItemSkeleton
                            media={media}
                            key={epNumber + index}
                            title={media.format !== "MOVIE" ? `Episode ${epNumber}` : media.title?.userPreferred || ""}
                            showImagePlaceholder
                            episodeTitle={aniZipData?.episodes[String(epNumber)]?.title?.en}
                            image={aniZipData?.episodes[String(epNumber)]?.image}
                            action={
                                <Link
                                    href={`/view/${media.id}/download?episode=${epNumber}`}
                                    className={"text-orange-200 absolue top-1 right-1 text-3xl absolute animate-pulse"}>
                                    <BiDownload/>
                                </Link>
                            }
                        >
                            <div className={"mt-1"}>
                                <p className={"flex gap-1 items-center text-sm text-[--muted]"}>
                                    <BiCalendarAlt/> {airDate ? `Aired on ${new Date(airDate).toLocaleDateString()}` : "Aired recently"}
                                </p>
                            </div>
                        </EpisodeItemSkeleton>
                    )
                })}
            </div>
        </>
    )

})
