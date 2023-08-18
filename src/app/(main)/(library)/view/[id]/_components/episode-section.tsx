"use client"
import React, { useMemo } from "react"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useLibraryEntry, useStoredLocalFiles } from "@/atoms/library"
import { Tooltip } from "@/components/ui/tooltip"
import { IconButton } from "@/components/ui/button"
import { BiLockOpenAlt } from "@react-icons/all-files/bi/BiLockOpenAlt"
import { VscVerified } from "@react-icons/all-files/vsc/VscVerified"

interface EpisodeSectionProps {
    children?: React.ReactNode
    detailedMedia: AnilistDetailedMedia
    aniZipData: AniZipData
}

export const EpisodeSection: React.FC<EpisodeSectionProps> = (props) => {

    const { children, detailedMedia, aniZipData, ...rest } = props

    const { entry, sortedFiles, watchOrderFiles } = useLibraryEntry(detailedMedia.id)
    const { localFiles, toggleMediaFileLocking, toggleFileLocking, getMediaFiles } = useStoredLocalFiles()


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

                {!!entry && <div className={""}>
                    <Tooltip trigger={
                        <IconButton
                            icon={allFilesAreLocked ? <VscVerified/> : <BiLockOpenAlt/>}
                            intent={allFilesAreLocked ? "success-basic" : "warning-basic"}
                            size={"xl"}
                            className={"hover:opacity-60"}
                            onClick={() => toggleMediaFileLocking(entry?.media.id)}
                        />
                    }>
                        {allFilesAreLocked ? "Unlock all files" : "Lock all files"}
                    </Tooltip>
                </div>}
            </div>
            {/*<pre>{JSON.stringify(aniZipData, null, 2)}</pre>*/}
            <div className={"grid grid-cols-2 gap-4"}>
                {watchOrderFiles.toWatch.map(file => {

                    const episodeData = aniZipData?.episodes[String(Number(file.parsedInfo?.episode))]

                    return (
                        <div key={file.path} className={"border border-[--border] p-4 rounded-lg relative"}>

                            <h4 className={"font-medium"}>{isMovie ? file.parsedInfo?.title : `Episode ${file.parsedInfo?.episode}`}</h4>
                            <p className={"text-sm text-[--muted]"}>{episodeData?.title?.en}</p>
                            <p className={"text-sm text-[--muted]"}>{file.parsedInfo?.original?.replace(/.(mkv|mp4)/, "")?.replaceAll(/(\[)[a-zA-Z0-9 ._~-]+(\])/ig, "")?.replaceAll(/[_,-]/g, " ")}</p>

                            <div className={"absolute right-1 top-1"}>
                                <IconButton
                                    icon={file.locked ? <VscVerified/> : <BiLockOpenAlt/>}
                                    intent={file.locked ? "success-basic" : "warning-basic"}
                                    size={"md"}
                                    className={"hover:opacity-60"}
                                    onClick={() => toggleFileLocking(file.path)}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
            -------
            <div>
                {watchOrderFiles.watched.reverse().map(file => {
                    return (
                        <div key={file.path}>
                            {file.name}
                        </div>
                    )
                })}
            </div>
        </div>
    )

}
