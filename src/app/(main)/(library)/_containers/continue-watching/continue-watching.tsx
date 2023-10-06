import { useSelectAtom } from "@/atoms/helpers"
import { useMediaDownloadInfo } from "@/lib/download/media-download-info"
import { useLibraryEntryDynamicDetails } from "@/atoms/library/local-file.atoms"
import React, { memo, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { useRouter } from "next/navigation"
import { LargeEpisodeListItem } from "@/components/shared/large-episode-list-item"
import { Atom } from "jotai"
import { LibraryEntry } from "@/atoms/library/library-entry.atoms"
import { formatDistanceToNow, isBefore, subYears } from "date-fns"
import { anilist_getCurrentEpisodeCeilingFromMedia } from "@/lib/anilist/utils"
import { anizip_getEpisode } from "@/lib/anizip/utils"
import { fetchAniZipData } from "@/lib/anizip/helpers"
import { AniZipData } from "@/lib/anizip/types"

export function ContinueWatching(props: { entryAtom: Atom<LibraryEntry> }) {

    const media = useSelectAtom(props.entryAtom, entry => entry.media)
    const currentlyWatching = useSelectAtom(props.entryAtom, entry => entry.collectionEntry?.status === "CURRENT")

    const { downloadInfo } = useMediaDownloadInfo(media)
    /**
     * [EPISODE-ZERO-SUPPORT]
     * - Here we will use `episodeProgress` instead of `progress` because we want the file's next episode number
     * - Since `progress` is 1-indexed it would give us the wrong episode number if the special is included
     */
    const { latestFile, episodeProgress, progress } = useLibraryEntryDynamicDetails(media.id)

    const nextMetadataEpisodeNumber = useMemo(() => {
        if (currentlyWatching) {
            const availableProgress = anilist_getCurrentEpisodeCeilingFromMedia(media)
            if (!downloadInfo.schedulingIssues) {
                if (
                    // Next episode has not been watched
                    progress < availableProgress
                    // Latest sorted file has an episode
                    && !!latestFile?.metadata?.episode
                    // Next episode has been downloaded
                    && !downloadInfo.episodeNumbers.includes(episodeProgress + 1) // [EPISODE-ZERO-SUPPORT]
                ) {
                    return episodeProgress + 1
                }
                // FIXME Hacky way to check if the next episode is downloaded when we don't have accurate scheduling information
            } else if (latestFile?.metadata?.episode === (episodeProgress + 1)) { // [EPISODE-ZERO-SUPPORT]
                return episodeProgress + 1
            }
        }
        return undefined
    }, [currentlyWatching, progress, downloadInfo.schedulingIssues, latestFile?.metadata?.episode, downloadInfo.episodeNumbers, media, episodeProgress])


    const { data, isLoading } = useQuery({
        queryKey: ["continue-watching-anizip", media.id, nextMetadataEpisodeNumber, progress, currentlyWatching],
        queryFn: async () => {
            return await fetchAniZipData(media.id)
        },
        keepPreviousData: false,
        enabled: !!nextMetadataEpisodeNumber,
        cacheTime: 1000 * 60 * 60,
    })

    if (!nextMetadataEpisodeNumber) return null


    return !isLoading ? (
        <>
            <EpisodeItem
                key={`${media.id}${nextMetadataEpisodeNumber}`}
                media={media}
                nextEpisodeProgress={progress + 1}
                nextEpisodeNumber={nextMetadataEpisodeNumber!}
                aniZipData={data}
            />
        </>
    ) : (
        <>
            <Skeleton
                className={"rounded-md h-auto overflow-hidden aspect-[4/2] w-96 relative flex items-end flex-none"}
            />
        </>
    )
}


type EpisodeItemProps = {
    media: AnilistShowcaseMedia
    nextEpisodeNumber: number
    nextEpisodeProgress: number
    aniZipData?: AniZipData
}

const EpisodeItem = memo(({ media, nextEpisodeProgress, nextEpisodeNumber, aniZipData }: EpisodeItemProps) => {

    /**
     * Here `nextEpisodeNumber` is 0-indexed IF the special is included
     * `nextEpisodeProgress` is 1-indexed
     */
    const episodeData = anizip_getEpisode(aniZipData, nextEpisodeProgress)

    const router = useRouter()

    const date = episodeData?.airdate ? new Date(episodeData?.airdate) : undefined
    const mediaIsOlder = useMemo(() => date ? isBefore(date, subYears(new Date(), 2)) : undefined, [])

    return (
        <>
            <LargeEpisodeListItem
                image={episodeData?.image || media.bannerImage}
                title={<span>{`Episode ${nextEpisodeNumber}`} {!!media.episodes &&
                    <span className={"opacity-40"}>/{` `}{media.episodes}</span>}</span>}
                topTitle={media.title?.userPreferred}
                actionIcon={undefined}
                meta={(date) ? (!mediaIsOlder ? `${formatDistanceToNow(date, { addSuffix: true })}` : new Intl.DateTimeFormat("en-US", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                }).format(date)) : undefined}
                onClick={() => {
                    router.push(`/view/${media.id}?playNext=true`)
                }}
            />
        </>
    )
})
