import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { LocalFile } from "@/lib/local-library/local-file"
import { useNormalizedEpisodeNumber } from "@/app/(main)/(library)/view/[id]/_components/normalize-episode-number"
import { MediaListStatus } from "@/gql/graphql"

export const getMediaEpisodeDownloadInfo = (
    media: AnilistDetailedMedia,
    lastFile: LocalFile | undefined,
    progress: number | null | undefined,
    libraryEntryExists: boolean,
    collectionEntryStatus: MediaListStatus | null | undefined,
) => {
    const normalizedLastEpisodeNumber = useNormalizedEpisodeNumber(lastFile?.parsedInfo, media)

    const nextEpisodeHasAired = (media.nextAiringEpisode?.timeUntilAiring) ? media.nextAiringEpisode?.timeUntilAiring <= 0 : undefined

    const downloadedEpisodeNumber = (lastFile && lastFile.parsedInfo?.episode) ? (normalizedLastEpisodeNumber ?? Number(lastFile.parsedInfo.episode)) : undefined

    const progressOrEpisodeNumber = !libraryEntryExists ? progress : (downloadedEpisodeNumber ?? progress)

    let result = undefined
    let rewatch = false
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
    if (collectionEntryStatus && collectionEntryStatus === "COMPLETED" && result === 0) {
        result = media.episodes ?? result // Reset the nb of episodes to download
        if ((downloadedEpisodeNumber && downloadedEpisodeNumber >= result) || (!downloadedEpisodeNumber && libraryEntryExists)) result = 0 // UNLESS it's already downloaded
        rewatch = true // Will re-watch
        batch = !!media.episodes // Can batch
    }
    // Movie case: couldn't find episodes but library entry exists
    if (collectionEntryStatus !== "COMPLETED" && (!downloadedEpisodeNumber || !lastFile) && libraryEntryExists) {
        result = 0
    }

    if (result && result < 0) result = 0

    return {
        toDownload: result ?? -1,
        originalEpisodeCount: media.episodes,
        rewatch,
        batch, // If there are some episodes to download, whether we can download a batch (finished and has no episodes downloaded)
    }


}
