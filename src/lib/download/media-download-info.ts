import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { MediaListStatus } from "@/gql/graphql"
import { useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist/entries.atoms"
import { useStableSelectAtom } from "@/atoms/helpers"
import {
    __useListenToLocalFiles,
    useLatestMainLocalFileByMediaId_UNSTABLE,
    useLocalFilesByMediaId_UNSTABLE,
} from "@/atoms/library/local-file.atoms"
import { useMemo } from "react"
import { LocalFile } from "@/lib/local-library/types"
import sortBy from "lodash/sortBy"
import { localFile_isMain } from "@/lib/local-library/utils/episode.utils"
import { anilist_getCurrentEpisodeCeilingFromMedia } from "@/lib/anilist/utils"

/**
 * @description Purpose
 * - Get various information related to downloading a media
 * @description Use
 * - `toDownload` = number of episodes to download
 * - `originalEpisodeCount` = number of episodes in the media
 * - `isMovie` = whether the media is a movie
 * - `episodeNumbers` = array of episode numbers to download
 * - `rewatch` = whether the user has completed the media
 * - `batch` = whether the **entire** batch should be downloaded (progress = 0, no files downloaded)
 * - `schedulingIssues` = whether the media is still airing but media.nextAiringEpisode is null due to scheduling issues
 * - `canBatch` = whether the media can be batch downloaded
 * @param props
 */
export const getMediaDownloadInfo = (props: {
    media: AnilistShowcaseMedia,
    files: LocalFile[],
    progress: number | null | undefined,
    status: MediaListStatus | null | undefined,
}) => {

    const { media, files, progress, status } = props

    const lastProgress = progress ?? 0
    // e.g., 12
    const maxEp = anilist_getCurrentEpisodeCeilingFromMedia(media)
    // e.g., [1,2,3,…,12]
    let mediaEpisodeArr = [...Array(maxEp).keys()].map((_, idx) => idx + 1)

    /**
     * [EPISODE-ZERO-SUPPORT]
     * - Sometimes AniList includes Episode 0, AniDB does not, so we detect if the special episode is included in the local files
     * - This treats AniDB as the source of truth when it comes to episode numbers
     *      - If in turn AniDB also includes Episode 0, then we need to alert the user to offset their episode numbers by 1
     * - `specialIsIncluded` is implemented as defined in [libraryEntryDynamicDetailsAtom]
     */
    const specialIsIncluded = files.filter(file => localFile_isMain(file)).some(file => file.metadata.episode === 0)
        && files.findIndex(file => file.metadata.episode === maxEp) === -1
        && !(media.episodes === 1 || media.format === "MOVIE")
    // e.g, If specialIsIncluded = true -> AniList ceiling = 12, files = [0,1,2,3,4,5,6,7,8,9,10,11]
    if (specialIsIncluded) {
        mediaEpisodeArr = [0, ...mediaEpisodeArr.slice(0, -1)]
    }

    // Media episode array starting from the last progress
    // e.g., progress = 9 => [10,11,12] | completed => [1,2,3,…,12]
    const actualEpisodeArr = status !== "COMPLETED" ? [...mediaEpisodeArr.slice(lastProgress)] : mediaEpisodeArr

    // e.g., [1,2]
    let downloadedEpisodeArr = files.filter(file => localFile_isMain(file)).map(file => file.metadata.episode)

    // Make sure that we handle movies correctly since they don't have episode numbers
    // No files with episode number, but we know that the media is a movie, and there is at least a file associated with that media
    if (
        (media.format === "MOVIE" || media.episodes === 1)
        && downloadedEpisodeArr.length === 0
        && files.filter(file => !file.metadata.isNC).length > 0 // there is at least a file associated with that media that is not NC
    ) {
        downloadedEpisodeArr = [1]
    }

    // Array of missing episodes
    let missingArr = sortBy(actualEpisodeArr.filter(num => !downloadedEpisodeArr.includes(num)))

    const canBatch = (media.status === "FINISHED" || media.status === "CANCELLED") && !!media.episodes && media.episodes > 1

    // /!\ This is a hacky fix for the case where the media is still airing but media.nextAiringEpisode is null due to scheduling issues
    const schedulingIssues = media.status === "RELEASING" && !media.nextAiringEpisode && !!media.episodes
    if (schedulingIssues) {
        missingArr = []
    }

    return {
        toDownload: missingArr.length,
        originalEpisodeCount: media.episodes,
        isMovie: media.format === "MOVIE",
        episodeNumbers: missingArr,
        rewatch: status === "COMPLETED",
        batch: canBatch && downloadedEpisodeArr.length === 0 && lastProgress === 0, // Media finished airing and user has no episodes downloaded/watched
        schedulingIssues,
        canBatch,
        specialIsIncluded,
    }


}

export type MediaDownloadInfo = ReturnType<typeof getMediaDownloadInfo>

/**
 * Invoke [getMediaDownloadInfo] with the appropriate parameters
 * @param media
 */
export function useMediaDownloadInfo(media: AnilistShowcaseMedia) {

    // Get the AniList collection entry to retrieve progress and status
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(media.id)
    const progress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress)
    const status = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status)
    // Get the library entry to retrieve the latest file
    const latestFile = useLatestMainLocalFileByMediaId_UNSTABLE(media.id)
    // Get all local files associated with the media
    const files = useLocalFilesByMediaId_UNSTABLE(media.id)

    const __ = __useListenToLocalFiles()

    const downloadInfo = useMemo(() => getMediaDownloadInfo({
        media: media,
        files: files,
        progress: progress,
        status: status,
    }), [__])

    return {
        latestFile,
        downloadInfo,
    }
}
