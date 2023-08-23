"use client"
import { __testNyaa } from "@/lib/download/nyaa/__test__"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useSelectAtom } from "@/atoms/helpers"
import { useLibraryEntryAtomByMediaId } from "@/atoms/library/library-entry.atoms"
import { useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist-collection"
import { useEffect, useState } from "react"
import { useLocalFilesByMediaId } from "@/atoms/library/local-file.atoms"
import { Button } from "@/components/ui/button"
import { getMediaDownloadInfo } from "@/lib/download/helpers"

interface DownloadPageProps {
    media: AnilistDetailedMedia,
    aniZipData: AniZipData
}

export function DownloadPage(props: DownloadPageProps) {

    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(props.media.id)
    const collectionEntryProgress = !!collectionEntryAtom ? useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress) : undefined
    const collectionEntryStatus = !!collectionEntryAtom ? useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status) : undefined
    const entryAtom = useLibraryEntryAtomByMediaId(props.media.id)

    const files = useLocalFilesByMediaId(props.media.id)
    const [episodeFiles] = useState(files.filter(file => !!file.parsedInfo?.episode).filter(Boolean))
    const [lastFile] = useState(episodeFiles.length > 1 ? episodeFiles.reduce((prev, curr) => Number(prev!.parsedInfo!.episode!) > Number(curr!.parsedInfo!.episode!) ? prev : curr) : episodeFiles[0] ?? undefined)

    const [downloadInfo] = useState(getMediaDownloadInfo({
        media: props.media,
        lastEpisodeFile: lastFile,
        progress: collectionEntryProgress,
        libraryEntryExists: !!entryAtom,
        status: collectionEntryStatus,
    }))


    useEffect(() => {
        (async () => {
            console.log(downloadInfo)
            console.log(await __testNyaa())
        })()
    }, [])


    return (
        <div>
            <Button onClick={() => console.log(downloadInfo)}>Hello</Button>
        </div>
    )
}
