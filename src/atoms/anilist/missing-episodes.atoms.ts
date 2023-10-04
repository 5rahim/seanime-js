import { atom } from "jotai"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { getMediaDownloadInfo, MediaDownloadInfo } from "@/lib/download/media-download-info"
import { libraryEntriesAtom } from "@/atoms/library/library-entry.atoms"
import { localFilesAtom } from "@/atoms/library/local-file.atoms"
import { userAtom } from "@/atoms/user"

/**
 * Go through each library entry, find media with missing episodes using `getMediaDownloadInfo`
 */
export const missingEpisodesAtom = atom<{ media: AnilistShowcaseMedia, downloadInfo: MediaDownloadInfo }[]>(get => {
    const entries = get(libraryEntriesAtom)
    const user = get(userAtom)
    let arr: { media: AnilistShowcaseMedia, downloadInfo: MediaDownloadInfo }[] = []
    // Go through each entry
    if (user) {
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
            if (downloadInfo.episodeNumbers.length > 0 && !downloadInfo.rewatch) {
                // Avoid clogging up the UI with too many missing episodes, only show 5 at most for the same media
                if (downloadInfo.toDownload < 5) {
                    arr.push({ media: entry.media, downloadInfo: downloadInfo })
                } else {
                    arr.push({
                        media: entry.media, downloadInfo: {
                            ...downloadInfo,
                            toDownload: 1,
                            episodeNumbers: [downloadInfo.episodeNumbers[0]],
                        },
                    })
                }
            }
        }
    }
    return arr
})


export const missingEpisodeCountAtom = atom(get => get(missingEpisodesAtom).flatMap(n => n.downloadInfo.episodeNumbers).length)
