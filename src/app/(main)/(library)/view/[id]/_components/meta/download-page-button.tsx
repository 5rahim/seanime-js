"use client"
import { PrimitiveAtom } from "jotai"
import { AnilistCollectionEntry } from "@/atoms/anilist-collection"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useSelectAtom } from "@/atoms/helpers"
import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useLibraryEntryAtomByMediaId } from "@/atoms/library/library-entry.atoms"
import { getMediaEpisodeDownloadInfo } from "@/lib/download/helpers"
import { BiDownload } from "@react-icons/all-files/bi/BiDownload"

export const DownloadPageButton = (
    { collectionEntryAtom, detailedMedia }: {
        collectionEntryAtom: PrimitiveAtom<AnilistCollectionEntry> | undefined,
        detailedMedia: AnilistDetailedMedia
    },
) => {

    const hasCollectionEntry = !!collectionEntryAtom

    const progress = hasCollectionEntry ? useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress) : undefined
    const collectionEntryStatus = hasCollectionEntry ? useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status) : undefined
    const entryAtom = useLibraryEntryAtomByMediaId(detailedMedia.id)
    const lastFile = entryAtom ? useSelectAtom(entryAtom, entry => {
        const files = entry.files.filter(file => file.parsedInfo?.episode).filter(Boolean)
        if (files.length > 1) {
            return files.reduce((prev, curr) => {
                return Number(prev!.parsedInfo!.episode!) > Number(curr!.parsedInfo!.episode!) ? prev : curr
            })
        } else
            return files[0] ?? undefined
    }) : undefined


    const downloadInfo = getMediaEpisodeDownloadInfo(
        detailedMedia, lastFile, progress, !!entryAtom, collectionEntryStatus,
    )

    if (downloadInfo.toDownload === 0) return null

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
