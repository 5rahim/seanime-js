import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { MediaListStatus } from "@/gql/graphql"
import { useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist/entries.atoms"
import { useStableSelectAtom } from "@/atoms/helpers"
import { useLibraryEntryAtomByMediaId } from "@/atoms/library/library-entry.atoms"
import { useLastMainLocalFileByMediaId, useLocalFilesByMediaId_UNSTABLE } from "@/atoms/library/local-file.atoms"
import { useMemo } from "react"
import { LocalFile } from "@/lib/local-library/types"
import sortBy from "lodash/sortBy"

export const getMediaDownloadInfo = (props: {
    media: AnilistDetailedMedia,
    files: LocalFile[],
    progress: number | null | undefined,
    status: MediaListStatus | null | undefined,
}) => {

    const { media, files, progress, status } = props

    const lastProgress = progress ?? 0
    // e.g., 12
    const maxEp = !!media.nextAiringEpisode?.episode ? media.nextAiringEpisode?.episode - 1 : media.episodes!
    // e.g., [1,2,3,…,12]
    const originalEpisodeArr = [...Array(maxEp).keys()].map((_, idx) => idx + 1)
    // e.g., progress = 9 => [10,11,12] | completed => [1,2,3,…,12]
    const actualEpisodeArr = status !== "COMPLETED" ? [...Array(maxEp).keys()].map((_, idx) => idx + 1).slice(lastProgress) : originalEpisodeArr

    // e.g., [1,2]
    let downloadedEpisodeArr = files.filter(file => !!file.metadata.episode && !file.metadata.isNC && !file.metadata.isSpecial).map(file => file.metadata.episode).filter(Boolean)

    // e.g., no files with episode number, but we know that the media is a movie, and there is at least a file associated with that media
    if ((media.format === "MOVIE" || media.episodes === 1) && downloadedEpisodeArr.length === 0 && files.filter(file => !file.metadata.episode && !file.metadata.isNC).length > 0) {
        downloadedEpisodeArr = [1]
    }

    let missingArr = sortBy(actualEpisodeArr.filter(num => !downloadedEpisodeArr.includes(num)))

    const canBatch = (media.status === "FINISHED" || media.status === "CANCELLED") && !!media.episodes && media.episodes > 1

    // FIXME This is a hacky fix for the case where the media is still airing but media.nextAiringEpisode is null due to scheduling issues
    const schedulingIssues = media.status === "RELEASING" && !media.nextAiringEpisode && !!media.episodes
    if (schedulingIssues) {
        console.log(media)
        missingArr = []
    }

    return {
        toDownload: missingArr.length,
        originalEpisodeCount: media.episodes,
        isMovie: media.format === "MOVIE",
        episodeNumbers: missingArr,
        rewatch: status === "COMPLETED",
        // batch = `entireBatch`, i.e., should download entire batch
        batch: canBatch && downloadedEpisodeArr.length === 0 && lastProgress === 0,  // Media finished airing and user has no episodes downloaded/watched
        schedulingIssues,
        canBatch,
    }


}

export type MediaDownloadInfo = ReturnType<typeof getMediaDownloadInfo>

export function useMediaDownloadInfo(media: AnilistDetailedMedia) {
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(media.id)
    const collectionEntryProgress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress)
    const collectionEntryStatus = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status)
    const entryAtom = useLibraryEntryAtomByMediaId(media.id)
    const lastFile = useLastMainLocalFileByMediaId(media.id)

    const files = useLocalFilesByMediaId_UNSTABLE(media.id)

    const downloadInfo = useMemo(() => getMediaDownloadInfo({
        media: media,
        files: files,
        progress: collectionEntryProgress,
        status: collectionEntryStatus,
    }), [files])

    return {
        entryAtom,
        collectionEntryAtom,
        collectionEntryProgress,
        collectionEntryStatus,
        lastFile,
        downloadInfo,
    }
}
