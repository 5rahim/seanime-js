"use client"
import React from "react"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useLibraryEntryAtomByMediaId } from "@/atoms/library/library-entry.atoms"
import { Divider } from "@/components/ui/divider"
import { ToggleLockStatusButton } from "@/app/(main)/view/_containers/episode-section/_components/toggle-lock-status"
import { UtilityButtons } from "@/app/(main)/view/_containers/episode-section/_components/utility-buttons"
import { EpisodeList } from "@/app/(main)/view/_containers/episode-section/_components/episode-list"
import {
    UndownloadedEpisodeList,
} from "@/app/(main)/view/_containers/episode-section/_components/undownloaded-episode-list"
import { useVideoPlayer } from "@/lib/video-player/use-video-player"
import { useSetAtom } from "jotai/react"
import {
    getLocalFileByNameAtom,
    useMainLocalFileAtomsByMediaId,
    useNCLocalFileAtomsByMediaId,
    useSpecialsLocalFileAtomsByMediaId,
} from "@/atoms/library/local-file.atoms"
import { useStableSelectAtom } from "@/atoms/helpers"
import { useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist/entries.atoms"
import { atomWithImmer } from "jotai-immer"
import { LocalFile } from "@/lib/local-library/local-file"
import { Button } from "@/components/ui/button"
import { FiPlayCircle } from "@react-icons/all-files/fi/FiPlayCircle"
import { useMount } from "react-use"
import { useQuery } from "@tanstack/react-query"
import { getConsumetMediaEpisodes } from "@/lib/consumet/actions"
import { Nullish } from "@/types/common"
import {
    ProgressTrackingButton,
    ProgressTrackingModal,
} from "@/app/(main)/view/_containers/episode-section/_components/progress-tracking"

interface EpisodeSectionProps {
    children?: React.ReactNode
    detailedMedia: AnilistDetailedMedia
    aniZipData: AniZipData
}

export const progressTrackingAtom = atomWithImmer<{ open: boolean, filesWatched: LocalFile[] }>({
    open: false,
    filesWatched: [],
})

export const useConsumetEpisodeData = (mediaId: Nullish<number>) => {
    const res = useQuery(["episode-data", mediaId], async () => {
        return await getConsumetMediaEpisodes(mediaId!)
    }, { enabled: !!mediaId, refetchOnWindowFocus: false, retry: 2, keepPreviousData: false })
    return res.data || undefined
}


export const EpisodeSection: React.FC<EpisodeSectionProps> = React.memo((props) => {

    const { children, detailedMedia, aniZipData, ...rest } = props

    const entryAtom = useLibraryEntryAtomByMediaId(detailedMedia.id)
    const { toWatch, watched } = useMainLocalFileAtomsByMediaId(detailedMedia.id)
    const ovaFileAtoms = useSpecialsLocalFileAtomsByMediaId(detailedMedia.id)
    const ncFileAtoms = useNCLocalFileAtomsByMediaId(detailedMedia.id)
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(detailedMedia.id)
    const status = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.media?.status)
    const progress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress)
    const nextUpFilePath = useStableSelectAtom(toWatch[0], file => file?.path)

    const consumetEpisodeData = useConsumetEpisodeData(detailedMedia.id)

    const maxEp = detailedMedia.nextAiringEpisode?.episode ? detailedMedia.nextAiringEpisode.episode - 1 : detailedMedia.episodes!
    const canTrackProgress = (!progress || progress < maxEp) && progress !== maxEp

    const setProgressTracking = useSetAtom(progressTrackingAtom)

    useMount(() => {
        setProgressTracking(draft => {
            return { open: false, filesWatched: [] }
        })
    })

    const getFile = useSetAtom(getLocalFileByNameAtom)
    // Video player
    const { playFile } = useVideoPlayer({
        onTick: console.log,
        onVideoComplete: (fileName) => {
            if (!!getFile(fileName)) {
                console.log("video completed")
                setProgressTracking(draft => {
                    draft.filesWatched.push(getFile(fileName)!)
                    return
                })
            }
        },
        onFilePlay: () => {
            setProgressTracking(draft => {
                draft.open = true
                return
            })
        },
    })

    if (!entryAtom) {
        return <div className={"space-y-10"}>
            {status !== "NOT_YET_RELEASED" ? <p>Not in your library</p> : <p>Not yet released</p>}
            <UndownloadedEpisodeList media={detailedMedia} aniZipData={aniZipData}
                                     consumetEpisodeData={consumetEpisodeData}/>
        </div>
    }

    return (
        <>
            <div>
                <div className={"mb-8 flex items-center justify-between"}>

                    <div className={"flex items-center gap-8"}>
                        <h2>{detailedMedia.format === "MOVIE" ? "Movie" : "Episodes"}</h2>
                        {watched.length > 0 && toWatch.length > 0 && !!nextUpFilePath && <>
                            <Button
                                size={"lg"}
                                intent={"white"}
                                rightIcon={<FiPlayCircle/>}
                                iconClassName={"text-2xl"}
                                onClick={() => playFile(nextUpFilePath)}
                            >
                                {detailedMedia.format === "MOVIE" ? "Watch" : "Play next episode"}
                            </Button>
                        </>}
                    </div>

                    {!!entryAtom && <div className={"space-x-4 flex items-center"}>
                        {canTrackProgress && <ProgressTrackingButton/>}
                        <UtilityButtons entryAtom={entryAtom}/>
                        <ToggleLockStatusButton entryAtom={entryAtom}/>
                    </div>}

                </div>

                {/*TODO: Re-watch now, Continue now, Watch now Button*/}

                <div className={"space-y-10"}>

                    <EpisodeList
                        fileAtoms={toWatch}
                        onPlayFile={playFile}
                        media={detailedMedia}
                        aniZipData={aniZipData}
                        consumetEpisodeData={consumetEpisodeData}
                    />

                    {watched.length > 0 && <>
                        {toWatch.length > 0 && <Divider/>}
                        <h3>Watched</h3>
                        <EpisodeList
                            fileAtoms={watched}
                            onPlayFile={playFile}
                            media={detailedMedia}
                            aniZipData={aniZipData}
                            consumetEpisodeData={consumetEpisodeData}
                        />
                    </>}

                    <UndownloadedEpisodeList media={detailedMedia} aniZipData={aniZipData}/>

                    {ovaFileAtoms.length > 0 && <>
                        <Divider/>
                        <h3>Specials</h3>

                        <EpisodeList
                            fileAtoms={ovaFileAtoms}
                            onPlayFile={playFile}
                            media={detailedMedia}
                            aniZipData={aniZipData}
                            consumetEpisodeData={consumetEpisodeData}
                        />
                    </>}

                    {ncFileAtoms.length > 0 && <>
                        <Divider/>
                        <h3>Others</h3>

                        <EpisodeList
                            fileAtoms={ncFileAtoms}
                            onPlayFile={playFile}
                            media={detailedMedia}
                            aniZipData={aniZipData}
                            consumetEpisodeData={consumetEpisodeData}
                        />
                    </>}

                </div>
            </div>

            {canTrackProgress && <ProgressTrackingModal media={detailedMedia} progress={progress}/>}
        </>
    )
})
