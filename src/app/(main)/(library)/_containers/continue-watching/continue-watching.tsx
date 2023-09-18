import { useSelectAtom } from "@/atoms/helpers"
import { useMediaDownloadInfo } from "@/lib/download/helpers"
import { useLastMainLocalFileByMediaId } from "@/atoms/library/local-file.atoms"
import React, { memo, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Skeleton } from "@/components/ui/skeleton"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { useRouter } from "next/navigation"
import { LargeEpisodeListItem } from "@/components/shared/large-episode-list-item"
import { Atom } from "jotai"
import { LibraryEntry } from "@/atoms/library/library-entry.atoms"
import { formatDistanceToNow, isBefore, subYears } from "date-fns"

export function ContinueWatching(props: { entryAtom: Atom<LibraryEntry> }) {

    const media = useSelectAtom(props.entryAtom, entry => entry.media)
    const currentlyWatching = useSelectAtom(props.entryAtom, entry => entry.collectionEntry?.status === "CURRENT")
    const progress = useSelectAtom(props.entryAtom, entry => entry.collectionEntry?.progress)

    const { downloadInfo } = useMediaDownloadInfo(media)
    const lastFile = useLastMainLocalFileByMediaId(media.id)

    const nextEpisode = useMemo(() => {
        if (currentlyWatching) {
            const availableEp = media?.nextAiringEpisode?.episode ? media?.nextAiringEpisode?.episode - 1 : media.episodes!
            // Next episode has not been watched
            // Latest sorted file has an episode
            // The episode has been downloaded
            if (availableEp > (progress || 0) && !!lastFile?.metadata?.episode && !downloadInfo.episodeNumbers.includes((progress || 0) + 1)) {
                return (progress || 0) + 1
            }
        }
        return undefined
    }, [media, currentlyWatching, progress, lastFile])


    const { data, isLoading } = useQuery({
        queryKey: ["continue-watching-episode", media.id, nextEpisode, progress],
        queryFn: async () => {
            const { data } = await axios.get<AniZipData>("https://api.ani.zip/mappings?anilist_id=" + Number(media.id))
            return data
        },
        keepPreviousData: false,
        enabled: !!nextEpisode,
        cacheTime: 1000 * 60 * 60,
    })

    /* aaa/aaa *******/

    if (!nextEpisode) return null


    return !isLoading ? (
        <>
            <EpisodeItem
                key={`${media.id}${nextEpisode}`}
                media={media}
                episodeNumber={nextEpisode!}
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
    episodeNumber: number
    aniZipData?: AniZipData
}

const EpisodeItem = memo(({ media, episodeNumber, aniZipData }: EpisodeItemProps) => {

    const episodeData = aniZipData?.episodes?.[String(episodeNumber)]

    const router = useRouter()

    const date = episodeData?.airdate ? new Date(episodeData?.airdate) : undefined
    const mediaIsOlder = useMemo(() => date ? isBefore(date, subYears(new Date(), 2)) : undefined, [])

    return (
        <>
            <LargeEpisodeListItem
                image={episodeData?.image || media.bannerImage}
                title={`Episode ${episodeNumber}`}
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
