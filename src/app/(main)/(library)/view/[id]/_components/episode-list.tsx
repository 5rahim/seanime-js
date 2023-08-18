"use client"
import React, { useEffect, useRef } from "react"
import { LocalFile } from "@/lib/local-library/local-file"
import Image from "next/image"
import { IconButton } from "@/components/ui/button"
import { VscVerified } from "@react-icons/all-files/vsc/VscVerified"
import { BiLockOpenAlt } from "@react-icons/all-files/bi/BiLockOpenAlt"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { BiDotsHorizontal } from "@react-icons/all-files/bi/BiDotsHorizontal"
import { LibraryEntry } from "@/lib/local-library/library-entry"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useStoredLocalFiles } from "@/atoms/library"
import { VideoPlayer } from "@/lib/video-player"
import { useSettings } from "@/atoms/settings"

interface EpisodeListProps {
    children?: React.ReactNode
    entry: LibraryEntry | undefined
    detailedMedia: AnilistDetailedMedia
    files: LocalFile[]
    aniZipData?: AniZipData
    unDownloadedEpisodes?: any //TODO
}

export const EpisodeList: React.FC<EpisodeListProps> = (props) => {

    const { children, files, entry, aniZipData, detailedMedia, ...rest } = props

    const { settings } = useSettings()
    const { localFiles, toggleMediaFileLocking, toggleFileLocking, getMediaFiles, unmatchFile } = useStoredLocalFiles()

    const videoPlayer = useRef(VideoPlayer(settings))

    useEffect(() => {
        videoPlayer.current = VideoPlayer(settings)
    }, [settings])

    const isMovie = detailedMedia.format === "MOVIE"

    async function handlePlayFile(file: LocalFile) {
        await videoPlayer.current.openVideo(file.path)
    }

    return (
        <>
            {files.map(file => {

                const episodeData = aniZipData?.episodes[String(Number(file.parsedInfo?.episode))]
                const fileTitle = file.parsedInfo?.original?.replace(/.(mkv|mp4)/, "")?.replaceAll(/(\[)[a-zA-Z0-9 ._~-]+(\])/ig, "")?.replaceAll(/[_,-]/g, " ")

                let title = fileTitle || "???"
                if (isMovie && file.parsedInfo?.title) title = file.parsedInfo.title
                if (file.parsedInfo?.episode) title = `Episode ${file.parsedInfo.episode}`

                return (
                    <div key={file.path}
                         className={"border border-[--border] p-4 pr-12 rounded-lg relative transition hover:bg-gray-900"}>

                        <div
                            className={"flex gap-4 relative cursor-pointer"}
                            onClick={async () => handlePlayFile(file)}
                        >
                            {episodeData?.image && <div
                                className="h-24 w-24 flex-none rounded-md object-cover object-center relative overflow-hidden">
                                <Image
                                    src={episodeData?.image}
                                    alt={""}
                                    fill
                                    quality={60}
                                    priority
                                    sizes="10rem"
                                    className="object-cover object-center"
                                />
                            </div>}

                            <div>
                                <h4 className={"font-medium"}>{title}</h4>
                                {!!episodeData && <p className={"text-sm text-[--muted]"}>{episodeData?.title?.en}</p>}
                                <p className={"text-sm text-[--muted]"}>{file.parsedInfo?.original?.replace(/.(mkv|mp4)/, "")?.replaceAll(/(\[)[a-zA-Z0-9 ._~-]+(\])/ig, "")?.replaceAll(/[_,-]/g, " ")}</p>
                            </div>
                        </div>

                        <div className={"absolute right-1 top-1 flex flex-col items-center"}>
                            <IconButton
                                icon={file.locked ? <VscVerified/> : <BiLockOpenAlt/>}
                                intent={file.locked ? "success-basic" : "warning-basic"}
                                size={"md"}
                                className={"hover:opacity-60"}
                                onClick={() => toggleFileLocking(file.path)}
                            />
                            <DropdownMenu trigger={
                                <IconButton
                                    icon={<BiDotsHorizontal/>}
                                    intent={"gray-basic"}
                                    size={"xs"}
                                />
                            }>
                                <DropdownMenu.Item
                                    onClick={() => unmatchFile(file.path)}
                                >Un-match</DropdownMenu.Item>
                            </DropdownMenu>
                        </div>
                    </div>
                )
            })}
        </>
    )

}
