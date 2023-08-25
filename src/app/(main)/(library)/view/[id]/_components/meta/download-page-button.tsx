"use client"
import { PrimitiveAtom } from "jotai"
import { AnilistCollectionEntry } from "@/atoms/anilist-collection"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useSelectAtom } from "@/atoms/helpers"
import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { entryLastEpisodeFileSelector, LibraryEntry } from "@/atoms/library/library-entry.atoms"
import { getMediaDownloadInfo } from "@/lib/download/helpers"
import { BiDownload } from "@react-icons/all-files/bi/BiDownload"

export const DownloadPageButton = (
    { entryAtom, collectionEntryAtom, detailedMedia }: {
        entryAtom: PrimitiveAtom<LibraryEntry> | undefined
        collectionEntryAtom: PrimitiveAtom<AnilistCollectionEntry> | undefined,
        detailedMedia: AnilistDetailedMedia
    },
) => {

    const collectionEntryProgress = !!collectionEntryAtom ? useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress) : undefined
    const collectionEntryStatus = !!collectionEntryAtom ? useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status) : undefined
    const lastFile = entryAtom ? useSelectAtom(entryAtom, entryLastEpisodeFileSelector) : undefined

    const downloadInfo = getMediaDownloadInfo({
        media: detailedMedia,
        lastEpisodeFile: lastFile,
        progress: collectionEntryProgress,
        libraryEntryExists: !!entryAtom,
        status: collectionEntryStatus,
    })

    if (downloadInfo.toDownload === 0) return <Link href={`/view/${detailedMedia.id}/download`}>Nothing to download
        REMOVE</Link>

    return (
        <div>
            <Link href={`/view/${detailedMedia.id}/download`}>
                {detailedMedia.format !== "MOVIE" &&
                    <Button className={"w-full"} intent={"white"} size={"lg"} leftIcon={<BiDownload/>}>
                        Download {downloadInfo.batch ? "batch /" : "next"} {downloadInfo.toDownload > 1 ? `${downloadInfo.toDownload} episodes` : "episode"}
                    </Button>}
                {detailedMedia.format === "MOVIE" &&
                    <Button className={"w-full"} intent={"white"} size={"lg"} leftIcon={<BiDownload/>}>Download
                        movie</Button>}
            </Link>
        </div>
    )
}
