import { atom } from "jotai"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { getMediaDownloadInfo, MediaDownloadInfo } from "@/lib/download/helpers"
import { libraryEntriesAtom } from "@/atoms/library/library-entry.atoms"
import { localFilesAtom } from "@/atoms/library/local-file.atoms"

/**
 * Go through each library entry, find media with missing episodes using `getMediaDownloadInfo`
 */
export const missingEpisodesAtom = atom<{ media: AnilistShowcaseMedia, downloadInfo: MediaDownloadInfo }[]>(get => {
    const entries = get(libraryEntriesAtom)
    let arr: { media: AnilistShowcaseMedia, downloadInfo: MediaDownloadInfo }[] = []
    // Go through each entry
    for (const entry of entries) {
        // Get the files, `getMediaDownloadInfo` will automatically detect the appropriate episode files
        const files = get(localFilesAtom).filter(file => file.mediaId === entry.media.id)
        // Get download info for the library entry
        const downloadInfo = getMediaDownloadInfo({
            media: entry.media,
            files: files,
            progress: entry.collectionEntry?.progress,
            status: entry.collectionEntry?.status,
        })
        // If the library entry has missing episodes
        if (downloadInfo.episodeNumbers.length > 0) {
            arr.push({ media: entry.media, downloadInfo: downloadInfo })
        }
    }
    return arr
})


export const missingEpisodeCountAtom = atom(get => get(missingEpisodesAtom).flatMap(n => n.downloadInfo.episodeNumbers).length)
