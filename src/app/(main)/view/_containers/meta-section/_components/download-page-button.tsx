"use client"
import { Atom } from "jotai"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useStableSelectAtom } from "@/atoms/helpers"
import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LibraryEntry } from "@/atoms/library/library-entry.atoms"
import { getMediaDownloadInfo } from "@/lib/download/helpers"
import { BiDownload } from "@react-icons/all-files/bi/BiDownload"
import { useSetAtom } from "jotai/react"
import { getLastMainLocalFileByMediaIdAtom } from "@/atoms/library/local-file.atoms"
import { AnilistCollectionEntry } from "@/atoms/anilist/entries.atoms"

export const DownloadPageButton = (
    { entryAtom, collectionEntryAtom, detailedMedia }: {
        entryAtom: Atom<LibraryEntry> | undefined
        collectionEntryAtom: Atom<AnilistCollectionEntry> | undefined,
        detailedMedia: AnilistDetailedMedia
    },
) => {

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

    // if (downloadInfo.toDownload === 0) return <Link href={`/view/${detailedMedia.id}/download`}>Nothing to download REMOVE</Link>
    if (downloadInfo.toDownload === 0) return null

    return (
        <div>
            <Link href={`/view/${detailedMedia.id}/torrent-search`}>
                {detailedMedia.format !== "MOVIE" &&
                    <Button className={"w-full"} intent={"white"} size={"lg"} leftIcon={<BiDownload/>}
                            iconClassName={"text-2xl"}>
                        Download {downloadInfo.batch ? "batch /" : "next"} {downloadInfo.toDownload > 1 ? `${downloadInfo.toDownload} episodes` : "episode"}
                    </Button>}
                {detailedMedia.format === "MOVIE" &&
                    <Button className={"w-full"} intent={"white"} size={"lg"} leftIcon={<BiDownload/>}
                            iconClassName={"text-2xl"}>Download
                        movie</Button>}
            </Link>
        </div>
    )
}
