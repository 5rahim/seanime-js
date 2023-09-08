import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { LocalFile } from "@/lib/local-library/local-file"
import { MediaListStatus } from "@/gql/graphql"
import { useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist/entries.atoms"
import { useStableSelectAtom } from "@/atoms/helpers"
import { useLibraryEntryAtomByMediaId } from "@/atoms/library/library-entry.atoms"
import { useSetAtom } from "jotai/react"
import { getLastMainLocalFileByMediaIdAtom } from "@/atoms/library/local-file.atoms"
import { useMemo } from "react"

/**
 * @description
 * - Returns the number of `available` episodes the user can download
 * - Returns a list of episode numbers the user can download
 * - Returns whether it is a re-watch
 * - Returns whether the user could download a batch
 * @param media
 * @param lastEpisodeFile
 * @param progress
 * @param libraryEntryExists
 * @param status
 */
export const getMediaDownloadInfo = (
    {
        media, lastEpisodeFile, progress, libraryEntryExists, status,
    }: {
        media: AnilistDetailedMedia,
        lastEpisodeFile: LocalFile | undefined,
        progress: number | null | undefined,
        libraryEntryExists: boolean,
        status: MediaListStatus | null | undefined,
    },
) => {

    const nextEpisodeHasAired = (media.nextAiringEpisode?.timeUntilAiring) ? media.nextAiringEpisode?.timeUntilAiring <= 0 : undefined

    const downloadedEpisodeNumber = (lastEpisodeFile && lastEpisodeFile.metadata.episode) ? lastEpisodeFile.metadata.episode : undefined

    const progressOrEpisodeNumber = !libraryEntryExists ? progress : (downloadedEpisodeNumber ?? progress)

    let result = undefined
    let rewatch = status ? status === "COMPLETED" : false
    let batch = false

    // If the media is finished
    if (media.status === "FINISHED" || media.status === "CANCELLED") {
        // If the user already watched some episodes -> subtract
        if (media.episodes) {
            result = +(media.episodes) - (progressOrEpisodeNumber ?? 0)
            if (result === media.episodes) { // Nb of episodes to download is the same has the number of episodes
                batch = true
            }
        }
    } else { // The media is still publishing
        if (media.nextAiringEpisode?.episode) { // We have the next episode
            if (nextEpisodeHasAired) {
                result = +(media.nextAiringEpisode.episode) - (progressOrEpisodeNumber ?? 0)
            } else {
                // Next episode has not aired, use the precedent episode
                result = +(media.nextAiringEpisode.episode - 1) - (progressOrEpisodeNumber ?? 0)
            }
        }
    }

    // User completed the anime and may have already watched everything
    if (status && status === "COMPLETED" && result === 0) {
        result = media.episodes ?? result // Reset the nb of episodes to download
        if ((downloadedEpisodeNumber && downloadedEpisodeNumber >= result) || (!downloadedEpisodeNumber && libraryEntryExists)) result = 0 // UNLESS it's already downloaded
        batch = !!media.episodes // Can batch
    }
    // Movie case: couldn't find episodes but library entry exists
    if (status !== "COMPLETED" && (!downloadedEpisodeNumber || !lastEpisodeFile) && libraryEntryExists) {
        result = 0
    }

    if (result && result < 0) result = 0

    let episodeNumbers: number[] = []

    if (result && result > 0) {
        const lastEpisodeWatched = status === "COMPLETED" ? (downloadedEpisodeNumber ?? 0) : (progressOrEpisodeNumber ?? 0)
        for (let i = 0; i < result; i++) {
            episodeNumbers.push(lastEpisodeWatched + (i + 1))
        }
    }

    return {
        toDownload: result ?? -1,
        originalEpisodeCount: media.episodes,
        isMovie: media.format === "MOVIE",
        episodeNumbers,
        rewatch,
        batch, // Media finished airing and user has no episodes downloaded/watched
        canBatch: (media.status === "FINISHED" || media.status === "CANCELLED") && !!media.episodes && media.episodes > 1,
    }


}

export type MediaDownloadInfo = ReturnType<typeof getMediaDownloadInfo>

export function useDownloadPageData(media: AnilistDetailedMedia) {
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(media.id)
    const collectionEntryProgress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress)
    const collectionEntryStatus = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status)
    const entryAtom = useLibraryEntryAtomByMediaId(media.id)
    const entryFileCount = useStableSelectAtom(entryAtom, entry => entry.files.length) || 0

    const getLastFile = useSetAtom(getLastMainLocalFileByMediaIdAtom)
    const lastFile = useMemo(() => getLastFile(media.id), [entryFileCount]) // Refetch the last file when the number of file changes

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
