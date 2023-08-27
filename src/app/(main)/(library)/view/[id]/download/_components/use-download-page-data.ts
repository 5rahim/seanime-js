import { useSelectAtom } from "@/atoms/helpers"
import { useLibraryEntryAtomByMediaId } from "@/atoms/library/library-entry.atoms"
import { getLastMainLocalFileByMediaIdAtom } from "@/atoms/library/local-file.atoms"
import { useMemo } from "react"
import { getMediaDownloadInfo } from "@/lib/download/helpers"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useSettings } from "@/atoms/settings"
import { useSetAtom } from "jotai/react"
import { useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist/entries.atoms"

export function useDownloadPageData(media: AnilistDetailedMedia) {
    const { settings } = useSettings()
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(media.id)
    const collectionEntryProgress = !!collectionEntryAtom ? useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress) : undefined
    const collectionEntryStatus = !!collectionEntryAtom ? useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status) : undefined
    const entryAtom = useLibraryEntryAtomByMediaId(media.id)
    const sharedPath = !!entryAtom ? useSelectAtom(entryAtom, entry => entry.sharedPath) : (settings.library.localDirectory + "\\" + media.title?.userPreferred)

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
        sharedPath,
    }
}
