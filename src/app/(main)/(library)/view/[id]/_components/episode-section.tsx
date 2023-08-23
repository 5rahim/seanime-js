"use client"
import React, { useCallback, useEffect, useRef } from "react"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useLibraryEntryAtomByMediaId } from "@/atoms/library/library-entry.atoms"
import {
    useMainLocalFileAtomsByMediaId,
    useNCLocalFileAtomsByMediaId,
    useOVALocalFileAtomsByMediaId,
} from "@/atoms/library/local-file.atoms"
import { VideoPlayer } from "@/lib/video-player"
import { useSettings } from "@/atoms/settings"
import { Divider } from "@/components/ui/divider"
import { ToggleLockStatusButton } from "@/app/(main)/(library)/view/[id]/_components/episodes/toggle-lock-status-button"
import { UtilityButtons } from "@/app/(main)/(library)/view/[id]/_components/episodes/utility-buttons"
import { EpisodeList } from "@/app/(main)/(library)/view/[id]/_components/episodes/episode-list"

interface EpisodeSectionProps {
    children?: React.ReactNode
    detailedMedia: AnilistDetailedMedia
    aniZipData: AniZipData
}

export const EpisodeSection: React.FC<EpisodeSectionProps> = React.memo((props) => {

    const { children, detailedMedia, aniZipData, ...rest } = props
    const { settings } = useSettings()

    const entryAtom = useLibraryEntryAtomByMediaId(detailedMedia.id)
    const { toWatch, watched } = useMainLocalFileAtomsByMediaId(detailedMedia.id)
    const ovaFileAtoms = useOVALocalFileAtomsByMediaId(detailedMedia.id)
    const ncFileAtoms = useNCLocalFileAtomsByMediaId(detailedMedia.id)

    useEffect(() => {
        videoPlayer.current = VideoPlayer(settings)
    }, [settings])

    const isMovie = detailedMedia.format === "MOVIE"
    const videoPlayer = useRef(VideoPlayer(settings))

    if (!entryAtom) {
        return <div>
            Not in your library
        </div>
    }


    const handlePlayFile = useCallback(async (path: string) => {
        await videoPlayer.current.openVideo(path)
    }, [videoPlayer.current])

    return (
        <div>
            <div className={"mb-8 flex items-center justify-between"}>

                <h2 className={"flex items-center gap-2"}>
                    {isMovie ? "Movie" : "Episodes"}
                </h2>

                {!!entryAtom && <div className={"space-x-4"}>
                    <UtilityButtons entryAtom={entryAtom}/>
                    <ToggleLockStatusButton entryAtom={entryAtom}/>
                </div>}

            </div>

            {/*TODO: Re-watch now, Continue now, Watch now Button*/}

            <div className={"space-y-10"}>

                <EpisodeList
                    fileAtoms={toWatch}
                    onPlayFile={handlePlayFile}
                    media={detailedMedia}
                    aniZipData={aniZipData}
                />

                {watched.length > 0 && <>
                    {toWatch.length > 0 && <Divider/>}
                    <h3>Watched</h3>
                    <EpisodeList
                        fileAtoms={watched}
                        onPlayFile={handlePlayFile}
                        media={detailedMedia}
                        aniZipData={aniZipData}
                    />
                </>}

                {ovaFileAtoms.length > 0 && <>
                    <Divider/>
                    <h3>Specials</h3>

                    <EpisodeList
                        fileAtoms={ovaFileAtoms}
                        onPlayFile={handlePlayFile}
                        media={detailedMedia}
                        aniZipData={aniZipData}
                    />
                </>}

                {ncFileAtoms.length > 0 && <>
                    <Divider/>
                    <h3>Others</h3>

                    <EpisodeList
                        fileAtoms={ncFileAtoms}
                        onPlayFile={handlePlayFile}
                        media={detailedMedia}
                        aniZipData={aniZipData}
                    />
                </>}

            </div>
        </div>
    )
})
