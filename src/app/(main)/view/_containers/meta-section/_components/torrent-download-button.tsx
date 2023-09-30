"use client"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import React from "react"
import { Button } from "@/components/ui/button"
import { useMediaDownloadInfo } from "@/lib/download/helpers"
import { BiDownload } from "@react-icons/all-files/bi/BiDownload"
import { useSetAtom } from "jotai/react"
import { __torrentSearch_isOpenAtom } from "@/app/(main)/view/_containers/torrent-search/torrent-search-modal"
import { FiSearch } from "@react-icons/all-files/fi/FiSearch"

/**
 * This button is displayed when the user is able to download new episodes
 * @param detailedMedia
 */
export function TorrentDownloadButton(
    { detailedMedia }: {
        detailedMedia: AnilistDetailedMedia
    },
) {

    const setTorrentSearchIsOpen = useSetAtom(__torrentSearch_isOpenAtom)

    const { downloadInfo } = useMediaDownloadInfo(detailedMedia)

    // if (downloadInfo.toDownload === 0 && !downloadInfo.schedulingIssues) return null

    function openTorrentSearch() {
        setTorrentSearchIsOpen({ isOpen: true, episode: undefined })
    }

    return (
        <div>
            {downloadInfo.schedulingIssues && <p className={"text-orange-200 text-center mb-3"}>
                <span className={"block"}>Could not retrieve accurate scheduling information for this show.</span>
                <span className={"block text-[--muted]"}>Please check the schedule online for more information.</span>
            </p>}
            <Button
                className={"w-full"}
                intent={!downloadInfo.schedulingIssues ? "white" : "warning-subtle"}
                size={"lg"}
                leftIcon={!downloadInfo.schedulingIssues ? <BiDownload/> : <FiSearch/>}
                iconClassName={"text-2xl"}
                onClick={openTorrentSearch}
            >
                {(!downloadInfo.schedulingIssues && downloadInfo.toDownload > 0) ? <>
                    {(detailedMedia.format !== "MOVIE") && `Download ${downloadInfo.batch ? "batch /" : "next"} ${downloadInfo.toDownload > 1 ? `${downloadInfo.toDownload} episodes` : "episode"}`}
                    {(detailedMedia.format === "MOVIE") && `Download movie`}
                </> : <>
                    Search for torrents
                </>}
            </Button>
        </div>
    )
}
