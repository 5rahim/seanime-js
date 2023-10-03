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
import { Button } from "@/components/ui/button"
import { FiPlayCircle } from "@react-icons/all-files/fi/FiPlayCircle"
import {
    __progressTrackingAtom,
    ProgressTrackingButton,
    ProgressTrackingModal,
} from "@/app/(main)/view/_containers/episode-section/_components/progress-tracking"
import { useAnifyAnimeMetadata } from "@/lib/anify/helpers"
import { PlayNextFile } from "@/app/(main)/view/_containers/episode-section/_components/play-next-file"
import { EpisodeSectionSlider } from "@/app/(main)/view/_containers/episode-section/_components/episode-section-slider"
import { AppLayoutStack } from "@/components/ui/app-layout"
import dynamic from "next/dynamic"
import { Alert } from "@/components/ui/alert"
import { anilist_canTrackProgress } from "@/lib/anilist/utils"
import { localFile_isMain } from "@/lib/local-library/utils/episode.utils"

const EpisodeOffsetAction = dynamic(() => import("@/app/(main)/view/_containers/episode-section/_components/bulk-actions/episode-offset-action"), { ssr: false })

interface EpisodeSectionProps {
    children?: React.ReactNode
    detailedMedia: AnilistDetailedMedia
    aniZipData?: AniZipData
}

export const EpisodeSection: React.FC<EpisodeSectionProps> = (props) => {

    const { children, detailedMedia, aniZipData, ...rest } = props

    const entryAtom = useLibraryEntryAtomByMediaId(detailedMedia.id)
    const {
        toWatch,
        toWatchSlider,
        watched,
        allMain,
        mediaIncludesSpecial,
    } = useDisplayLocalFileAtomsByMediaId(detailedMedia.id)
    const ovaFileAtoms = useSpecialsLocalFileAtomsByMediaId(detailedMedia.id)
    const ncFileAtoms = useNCLocalFileAtomsByMediaId(detailedMedia.id)
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(detailedMedia.id)
    const mediaStatus = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.media?.status)
    const progress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress)

    const canTrackProgress = anilist_canTrackProgress(detailedMedia, progress)
    const nextUpFilePath = useStableSelectAtom(canTrackProgress ? toWatch[0] : toWatch[toWatch.length - 1], file => file?.path)
    const { anifyEpisodeData } = useAnifyAnimeMetadata(detailedMedia.id)

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
            if (file && localFile_isMain(file)) {
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
            <div className={"lg:max-h-[1015px] overflow-y-auto pt-4 lg:pt-0 space-y-10"}>
                <UndownloadedEpisodeList
                    media={detailedMedia}
                    aniZipData={aniZipData}
                    anifyEpisodeData={anifyEpisodeData}
                />
            </div>
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

                {(
                    !!aniZipData?.episodeCount && !!detailedMedia.episodes
                    && aniZipData?.episodeCount !== detailedMedia.episodes
                    && detailedMedia.status !== "RELEASING"
                    && detailedMedia.status !== "NOT_YET_RELEASED"
                    && allMain.length !== detailedMedia.episodes // AniList is the single source of truth for episode numbers
                    && aniZipData?.episodeCount < detailedMedia.episodes
                ) && <Alert
                    title={"Episode count mismatch"}
                    intent={"warning-basic"}
                    description={<div className={"space-y-1.5 mt-1"}>
                        <p>The number of episodes on AniDB ({aniZipData?.episodeCount}) does not match the number of
                            episodes on AniList ({detailedMedia.episodes}). In order to accurately track your progress
                            you should download that episode</p>
                        {!!aniZipData.episodes["S1"] && <>
                            <p className={"text-[1.1rem]"}>{`->`} <strong>Seanime detected that AniList might be
                                counting a "Special" episode as a main one.</strong></p>
                            <p>&nbsp;e.g., You might be missing Episode 0.</p>
                        </>}
                        <p>
                            <a href={"https://anidb.net/anime/" + aniZipData.mappings.anidb_id} target={"_blank"}
                               className={"text-brand-200 underline underline-offset-1"}>Open on AniDB</a>
                        </p>
                    </div>}
                />}

                {(toWatchSlider.length > 0) && (
                    <>
                        <EpisodeSectionSlider
                            fileAtoms={toWatchSlider}
                            onPlayFile={playFile}
                            media={detailedMedia}
                            aniZipData={aniZipData}
                            anifyEpisodeData={anifyEpisodeData}
                        />
                        <Divider/>
                    </>
                )}

                <div className={"space-y-10 lg:max-h-[1015px] overflow-y-auto"}>

                    {allMain.length > 0 && <EpisodeList
                        fileAtoms={allMain}
                        onPlayFile={playFile}
                        media={detailedMedia}
                        aniZipData={aniZipData}
                        anifyEpisodeData={anifyEpisodeData}
                    />}

                    {/*{watched.length > 0 && <>*/}
                    {/*    {toWatch.length > 0 && <Divider/>}*/}
                    {/*    <h3>Watched</h3>*/}
                    {/*    <EpisodeList*/}
                    {/*        fileAtoms={watched}*/}
                    {/*        onPlayFile={playFile}*/}
                    {/*        media={detailedMedia}*/}
                    {/*        aniZipData={aniZipData}*/}
                    {/*        anifyEpisodeData={anifyEpisodeData}*/}
                    {/*    />*/}
                    {/*</>}*/}

                    <UndownloadedEpisodeList
                        media={detailedMedia}
                        aniZipData={aniZipData}
                        anifyEpisodeData={anifyEpisodeData}
                    />

                    {ovaFileAtoms.length > 0 && <>
                        <Divider/>
                        <h3>Specials</h3>

                        <EpisodeList
                            fileAtoms={ovaFileAtoms}
                            onPlayFile={playFile}
                            media={detailedMedia}
                            aniZipData={aniZipData}
                            anifyEpisodeData={anifyEpisodeData}
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
                            anifyEpisodeData={anifyEpisodeData}
                        />
                    </>}

                </div>
            </AppLayoutStack>

            {canTrackProgress && <ProgressTrackingModal media={detailedMedia} progress={progress}
                                                        mediaIncludesSpecial={mediaIncludesSpecial}/>}
            {<EpisodeOffsetAction/>}
        </>
    )
}
