import { useStableSelectAtom } from "@/atoms/helpers"
import { useLibraryEntryAtomByMediaId } from "@/atoms/library/library-entry.atoms"
import { getLastMainLocalFileByMediaIdAtom } from "@/atoms/library/local-file.atoms"
import { useMemo } from "react"
import { getMediaDownloadInfo } from "@/lib/download/helpers"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useSetAtom } from "jotai/react"
import { useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist/entries.atoms"

export function useDownloadPageData(media: AnilistDetailedMedia) {
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(media.id)
    const collectionEntryProgress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress)
    const collectionEntryStatus = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status)
    const entryAtom = useLibraryEntryAtomByMediaId(media.id)

    const getLastFile = useSetAtom(getLastMainLocalFileByMediaIdAtom)
    const lastFile = getLastFile(media.id)

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
