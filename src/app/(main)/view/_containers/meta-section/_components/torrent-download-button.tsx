"use client"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import React from "react"
import { Button } from "@/components/ui/button"
import { useMediaDownloadInfo } from "@/lib/download/helpers"
import { BiDownload } from "@react-icons/all-files/bi/BiDownload"
import { useSetAtom } from "jotai/react"
import { __torrentSearch_isOpenAtom } from "@/app/(main)/view/_containers/torrent-search/torrent-search-modal"

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

    if (downloadInfo.toDownload === 0) return null

    function openTorrentSearch() {
        setTorrentSearchIsOpen({ isOpen: true, episode: undefined })
    }

    return (
        <div>
            <Button
                className={"w-full"}
                intent={"white"}
                size={"lg"}
                leftIcon={<BiDownload/>}
                iconClassName={"text-2xl"}
                onClick={openTorrentSearch}
            >
                {detailedMedia.format !== "MOVIE" ?
                    `Download ${downloadInfo.batch ? "batch /" : "next"} ${downloadInfo.toDownload > 1 ? `${downloadInfo.toDownload} episodes` : "episode"}` :
                    `Download movie`
                }
            </Button>
        </div>
    )
}
