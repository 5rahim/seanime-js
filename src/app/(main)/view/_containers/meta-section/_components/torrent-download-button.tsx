"use client"
import { Atom } from "jotai"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useStableSelectAtom } from "@/atoms/helpers"
import React from "react"
import { Button } from "@/components/ui/button"
import { LibraryEntry } from "@/atoms/library/library-entry.atoms"
import { getMediaDownloadInfo } from "@/lib/download/helpers"
import { BiDownload } from "@react-icons/all-files/bi/BiDownload"
import { useSetAtom } from "jotai/react"
import { getLastMainLocalFileByMediaIdAtom } from "@/atoms/library/local-file.atoms"
import { AnilistCollectionEntry } from "@/atoms/anilist/entries.atoms"
import { __torrentSearch_isOpenAtom } from "@/app/(main)/view/_containers/torrent-search/torrent-search-modal"

/**
 * This button is displayed when the user is able to download new episodes
 * @param entryAtom
 * @param collectionEntryAtom
 * @param detailedMedia
 */
export function TorrentDownloadButton(
    { entryAtom, collectionEntryAtom, detailedMedia }: {
        entryAtom: Atom<LibraryEntry> | undefined
        collectionEntryAtom: Atom<AnilistCollectionEntry> | undefined,
        detailedMedia: AnilistDetailedMedia
    },
) {

    const setTorrentSearchIsOpen = useSetAtom(__torrentSearch_isOpenAtom)

    const collectionEntryProgress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress)
    const collectionEntryStatus = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status)

    const getLastFile = useSetAtom(getLastMainLocalFileByMediaIdAtom)
    const lastFile = entryAtom ? getLastFile(detailedMedia.id) : undefined

    const downloadInfo = getMediaDownloadInfo({
        media: detailedMedia,
        lastEpisodeFile: lastFile,
        progress: collectionEntryProgress,
        libraryEntryExists: !!entryAtom,
        status: collectionEntryStatus,
    })

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
