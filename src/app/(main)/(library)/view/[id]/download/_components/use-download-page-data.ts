import { useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist-collection"
import { useSelectAtom } from "@/atoms/helpers"
import { useLibraryEntryAtomByMediaId } from "@/atoms/library/library-entry.atoms"
import { useLocalFilesByMediaId } from "@/atoms/library/local-file.atoms"
import { useMemo } from "react"
import { getMediaDownloadInfo } from "@/lib/download/helpers"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"

export function useDownloadPageData(media: AnilistDetailedMedia) {
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(media.id)
    const collectionEntryProgress = !!collectionEntryAtom ? useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress) : undefined
    const collectionEntryStatus = !!collectionEntryAtom ? useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status) : undefined
    const entryAtom = useLibraryEntryAtomByMediaId(media.id)

    const files = useLocalFilesByMediaId(media.id)
    const episodeFiles = useMemo(() => files.filter(file => !!file.parsedInfo?.episode).filter(Boolean), [files])
    const lastFile = useMemo(() => episodeFiles.length > 1 ? episodeFiles.reduce((prev, curr) => Number(prev!.parsedInfo!.episode!) > Number(curr!.parsedInfo!.episode!) ? prev : curr) : episodeFiles[0] ?? undefined, [episodeFiles])

    const downloadInfo = useMemo(() => getMediaDownloadInfo({
        media: media,
        lastEpisodeFile: lastFile,
        progress: collectionEntryProgress,
        libraryEntryExists: !!entryAtom,
        status: collectionEntryStatus,
    }), [lastFile])

    return {
        entryAtom,
        collectionEntryAtom,
        collectionEntryProgress,
        collectionEntryStatus,
        lastFile,
        downloadInfo,
    }
}
