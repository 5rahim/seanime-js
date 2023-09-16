"use client"
import React, { useEffect } from "react"
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
    useDisplayLocalFileAtomsByMediaId,
    useNCLocalFileAtomsByMediaId,
    useSpecialsLocalFileAtomsByMediaId,
} from "@/atoms/library/local-file.atoms"
import { useStableSelectAtom } from "@/atoms/helpers"
import { useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist/entries.atoms"
import { atomWithImmer } from "jotai-immer"
import { LocalFile } from "@/lib/local-library/local-file"
import { Button } from "@/components/ui/button"
import { FiPlayCircle } from "@react-icons/all-files/fi/FiPlayCircle"
import {
    ProgressTrackingButton,
    ProgressTrackingModal,
} from "@/app/(main)/view/_containers/episode-section/_components/progress-tracking"
import { useAnifyEpisodeCovers } from "@/lib/anify/client"
import { PlayNextFile } from "@/app/(main)/view/_containers/episode-section/_components/play-next-file"
import { EpisodeSectionSlider } from "@/app/(main)/view/_containers/episode-section/_components/episode-section-slider"
import { AppLayoutStack } from "@/components/ui/app-layout"

interface EpisodeSectionProps {
    children?: React.ReactNode
    detailedMedia: AnilistDetailedMedia
    aniZipData?: AniZipData
}

export const __progressTrackingAtom = atomWithImmer<{ open: boolean, filesWatched: LocalFile[] }>({
    open: false,
    filesWatched: [],
})


export const EpisodeSection: React.FC<EpisodeSectionProps> = (props) => {

    const { children, detailedMedia, aniZipData, ...rest } = props
    const maxEp = detailedMedia.nextAiringEpisode?.episode ? detailedMedia.nextAiringEpisode.episode - 1 : detailedMedia.episodes!

    const entryAtom = useLibraryEntryAtomByMediaId(detailedMedia.id)
    const { toWatch, toWatchSlider, watched, allMain } = useDisplayLocalFileAtomsByMediaId(detailedMedia.id)
    const ovaFileAtoms = useSpecialsLocalFileAtomsByMediaId(detailedMedia.id)
    const ncFileAtoms = useNCLocalFileAtomsByMediaId(detailedMedia.id)
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(detailedMedia.id)
    const mediaStatus = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.media?.status)
    const progress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress)

    const canTrackProgress = (!progress || progress < maxEp) && progress !== maxEp
    const nextUpFilePath = useStableSelectAtom(canTrackProgress ? toWatch[0] : toWatch[toWatch.length - 1], file => file?.path)
    const { anifyEpisodeCovers } = useAnifyEpisodeCovers(detailedMedia.id)


    const setProgressTracking = useSetAtom(__progressTrackingAtom)

    useEffect(() => {
        setProgressTracking(draft => {
            return { open: false, filesWatched: [] }
        })
    }, [])

    const getFile = useSetAtom(getLocalFileByNameAtom)
    // Video player
    const { playFile } = useVideoPlayer({
        onTick: console.log,
        onVideoComplete: (fileName) => {
            const file = getFile(fileName)
            if (!!file && !file.metadata.isSpecial && !file.metadata.isNC) {
                console.log("video completed")
                setProgressTracking(draft => {
                    draft.filesWatched.push(file)
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
            {mediaStatus !== "NOT_YET_RELEASED" ? <p>Not in your library</p> : <p>Not yet released</p>}
            <UndownloadedEpisodeList
                media={detailedMedia}
                aniZipData={aniZipData}
                anifyEpisodeCovers={anifyEpisodeCovers}
            />
        </div>
    }

    return (
        <>
            <PlayNextFile playFile={playFile} path={nextUpFilePath}/>

            <AppLayoutStack spacing={"lg"}>

                <div className={"mb-8 flex flex-col md:flex-row items-center justify-between"}>

                    <div className={"flex items-center gap-8"}>
                        <h2>{detailedMedia.format === "MOVIE" ? "Movie" : "Episodes"}</h2>
                        {watched.length > 0 && toWatch.length > 0 && !!nextUpFilePath && <>
                            <Button
                                size={"lg"}
                                intent={"white"}
                                rightIcon={<FiPlayCircle/>}
                                iconClassName={"text-2xl"}
                                onClick={async () => await playFile(nextUpFilePath)}
                            >
                                {detailedMedia.format === "MOVIE" ? "Watch" : "Play next episode"}
                            </Button>
                        </>}
                    </div>

                    {!!entryAtom && <div className={"space-x-4 flex items-center"}>
                        {canTrackProgress && <ProgressTrackingButton/>}
                        <ToggleLockStatusButton entryAtom={entryAtom}/>
                        <UtilityButtons entryAtom={entryAtom}/>
                    </div>}

                </div>

                {(toWatchSlider.length > 0) && (
                    <>
                        <EpisodeSectionSlider
                            fileAtoms={toWatchSlider}
                            onPlayFile={playFile}
                            media={detailedMedia}
                            aniZipData={aniZipData}
                            anifyEpisodeCovers={anifyEpisodeCovers}
                        />
                        <Divider/>
                    </>
                )}

                <div className={"space-y-10 lg:max-h-[800px] overflow-y-auto"}>

                    {allMain.length > 0 && <EpisodeList
                        fileAtoms={allMain}
                        onPlayFile={playFile}
                        media={detailedMedia}
                        aniZipData={aniZipData}
                        anifyEpisodeCovers={anifyEpisodeCovers}
                    />}

                    {/*{watched.length > 0 && <>*/}
                    {/*    {toWatch.length > 0 && <Divider/>}*/}
                    {/*    <h3>Watched</h3>*/}
                    {/*    <EpisodeList*/}
                    {/*        fileAtoms={watched}*/}
                    {/*        onPlayFile={playFile}*/}
                    {/*        media={detailedMedia}*/}
                    {/*        aniZipData={aniZipData}*/}
                    {/*        anifyEpisodeCovers={anifyEpisodeCovers}*/}
                    {/*    />*/}
                    {/*</>}*/}

                    <UndownloadedEpisodeList
                        media={detailedMedia}
                        aniZipData={aniZipData}
                        anifyEpisodeCovers={anifyEpisodeCovers}
                    />

                    {ovaFileAtoms.length > 0 && <>
                        <Divider/>
                        <h3>Specials</h3>

                        <EpisodeList
                            fileAtoms={ovaFileAtoms}
                            onPlayFile={playFile}
                            media={detailedMedia}
                            aniZipData={aniZipData}
                            anifyEpisodeCovers={anifyEpisodeCovers}
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
                            anifyEpisodeCovers={anifyEpisodeCovers}
                        />
                    </>}

                </div>
            </AppLayoutStack>

            {canTrackProgress && <ProgressTrackingModal media={detailedMedia} progress={progress}/>}
        </>
    )
}
