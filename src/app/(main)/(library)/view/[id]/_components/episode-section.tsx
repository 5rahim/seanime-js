"use client"
import React, { startTransition, useMemo } from "react"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { Tooltip } from "@/components/ui/tooltip"
import { IconButton } from "@/components/ui/button"
import { BiLockOpenAlt } from "@react-icons/all-files/bi/BiLockOpenAlt"
import { VscVerified } from "@react-icons/all-files/vsc/VscVerified"
import { useSettings } from "@/atoms/settings"
import { VideoPlayer } from "@/lib/video-player"
import { EpisodeList } from "@/app/(main)/(library)/view/[id]/_components/episode-list"
import { Divider } from "@/components/ui/divider"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"
import toast from "react-hot-toast"
import { openDirectoryInExplorer } from "@/lib/helpers/directory"
import { type } from "@tauri-apps/api/os"
import { SiVlcmediaplayer } from "@react-icons/all-files/si/SiVlcmediaplayer"

import { legacy_useLibraryEntry } from "@/atoms/library/library-entry.atoms"
import { useStoredLocalFiles } from "@/atoms/library/local-file.atoms"

interface EpisodeSectionProps {
    children?: React.ReactNode
    detailedMedia: AnilistDetailedMedia
    aniZipData: AniZipData
}


export const EpisodeSection: React.FC<EpisodeSectionProps> = (props) => {

    const { children, detailedMedia, aniZipData, ...rest } = props

    const { settings } = useSettings()
    const { entry, watchOrderFiles, ncFiles, ovaFiles } = legacy_useLibraryEntry(detailedMedia.id)
    const { localFiles, toggleMediaFileLocking, getMediaFiles } = useStoredLocalFiles()


    const isMovie = detailedMedia.format === "MOVIE"
    const files = useMemo(() => getMediaFiles(entry?.media.id), [localFiles])
    const allFilesAreLocked = files.every(file => file.locked)

    if (!entry) {
        return <div>
            Not in your library
        </div>
    }

    return (
        <div>
            <div className={"mb-8 flex items-center justify-between"}>
                <h2>{isMovie ? "Movie" : "Episodes"}</h2>

                {!!entry && <div className={"space-x-4"}>
                    <Tooltip trigger={<IconButton
                        icon={<SiVlcmediaplayer/>}
                        intent={"warning-basic"}
                        size={"xl"}
                        className={"hover:opacity-60"}
                        onClick={async () => {
                            await VideoPlayer(settings).start()
                        }}
                    />}>
                        Start video player
                    </Tooltip>
                    <IconButton
                        icon={<BiFolder/>}
                        intent={"gray-basic"}
                        size={"xl"}
                        className={"hover:opacity-60"}
                        onClick={async () => {
                            const tID = toast.loading("Opening")
                            await openDirectoryInExplorer(entry.sharedPath, await type())
                            setTimeout(() => {
                                toast.remove(tID)
                            }, 1000)
                        }}
                    />

                    <Tooltip trigger={
                        <IconButton
                            icon={allFilesAreLocked ? <VscVerified/> : <BiLockOpenAlt/>}
                            intent={allFilesAreLocked ? "success-subtle" : "warning-subtle"}
                            size={"xl"}
                            className={"hover:opacity-60"}
                            onClick={() => {
                                startTransition(() => {
                                    toggleMediaFileLocking(entry?.media.id)
                                })
                            }}
                        />
                    }>
                        {allFilesAreLocked ? "Unlock all files" : "Lock all files"}
                    </Tooltip>
                </div>}
            </div>
            {/*<pre>{JSON.stringify(aniZipData, null, 2)}</pre>*/}

            <div className={"space-y-10"}>
                <div className={"grid grid-cols-2 gap-4"}>
                    <EpisodeList
                        entry={entry}
                        detailedMedia={detailedMedia}
                        files={watchOrderFiles.toWatch}
                        aniZipData={aniZipData}
                    />
                </div>


                {watchOrderFiles.watched.length > 0 && <div className={"space-y-10"}>
                    <Divider/>

                    <h3>Watched</h3>

                    <div className={"grid grid-cols-2 gap-4"}>
                        <EpisodeList
                            entry={entry}
                            detailedMedia={detailedMedia}
                            files={watchOrderFiles.watched}
                            aniZipData={aniZipData}
                        />
                    </div>

                </div>}


                {ovaFiles.length > 0 && <div className={"space-y-10"}>
                    <Divider/>

                    <h3>Specials</h3>

                    <div className={"grid grid-cols-2 gap-4"}>
                        <EpisodeList
                            entry={entry}
                            detailedMedia={detailedMedia}
                            files={ovaFiles}
                            aniZipData={aniZipData}
                        />
                    </div>

                </div>}

                {ncFiles.length > 0 && <div className={"space-y-10"}>
                    <Divider/>

                    <h3>Others</h3>

                    <div className={"grid grid-cols-2 gap-4"}>
                        <EpisodeList
                            entry={entry}
                            detailedMedia={detailedMedia}
                            files={ncFiles}
                            aniZipData={aniZipData}
                        />
                    </div>

                </div>}


            </div>

        </div>
    )

}
