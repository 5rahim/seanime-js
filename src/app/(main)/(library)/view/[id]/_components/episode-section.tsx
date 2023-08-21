"use client"
import React, { startTransition, useEffect, useRef } from "react"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { LibraryEntry, useLibraryEntryAtomByMediaId } from "@/atoms/library/library-entry.atoms"
import {
    useMainLocalFileAtomsByMediaId,
    useNCLocalFileAtomsByMediaId,
    useOVALocalFileAtomsByMediaId,
    useSetLocalFiles,
} from "@/atoms/library/local-file.atoms"
import { VscVerified } from "@react-icons/all-files/vsc/VscVerified"
import { BiLockOpenAlt } from "@react-icons/all-files/bi/BiLockOpenAlt"
import { Tooltip } from "@/components/ui/tooltip"
import { IconButton } from "@/components/ui/button"
import { PrimitiveAtom } from "jotai"
import { useFocusSetAtom, useSelectAtom } from "@/atoms/helpers"
import { SiVlcmediaplayer } from "@react-icons/all-files/si/SiVlcmediaplayer"
import { VideoPlayer } from "@/lib/video-player"
import { useSettings } from "@/atoms/settings"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"
import toast from "react-hot-toast"
import { openDirectoryInExplorer } from "@/lib/helpers/directory"
import { type } from "@tauri-apps/api/os"
import { LocalFile } from "@/lib/local-library/local-file"
import { Divider } from "@/components/ui/divider"
import Image from "next/image"
import { BiDotsHorizontal } from "@react-icons/all-files/bi/BiDotsHorizontal"
import { DropdownMenu } from "@/components/ui/dropdown-menu"

interface EpisodeSectionProps {
    children?: React.ReactNode
    detailedMedia: AnilistDetailedMedia
    aniZipData: AniZipData
}

export const EpisodeSection: React.FC<EpisodeSectionProps> = (props) => {

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


    async function handlePlayFile(path: string) {
        await videoPlayer.current.openVideo(path)
    }

    return (
        <div>
            <div className={"mb-8 flex items-center justify-between"}>
                <h2>{isMovie ? "Movie" : "Episodes"}</h2>

                {!!entryAtom && <div className={"space-x-4"}>
                    <UtilityButtons entryAtom={entryAtom}/>
                    <ToggleLockStatusButton entryAtom={entryAtom}/>
                </div>}

            </div>
            <div className={"space-y-10"}>

                <EpisodeList
                    fileAtoms={toWatch}
                    onPlayFile={handlePlayFile}
                    media={detailedMedia}
                    aniZipData={aniZipData}
                />


                {watched.length > 0 && <>
                    <Divider/>
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
}

export const EpisodeList = React.memo((props: {
    fileAtoms: PrimitiveAtom<LocalFile>[],
    aniZipData?: AniZipData,
    onPlayFile: (path: string) => void
    media: AnilistDetailedMedia
}) => {

    const { fileAtoms, ...rest } = props


    return (
        <div className={"grid grid-cols-2 gap-4"}>
            {fileAtoms.map(fileAtom => (
                <EpisodeItem key={`${fileAtom}`} fileAtom={fileAtom} {...rest} />
            ))}
        </div>
    )
})

export const EpisodeItem = React.memo((props: {
    fileAtom: PrimitiveAtom<LocalFile>,
    aniZipData?: AniZipData,
    onPlayFile: (path: string) => void
    media: AnilistDetailedMedia
}) => {

    const { fileAtom, aniZipData, onPlayFile, media } = props

    const mediaID = useSelectAtom(fileAtom, file => file.mediaId) // Listen to changes in order to unmount when we unmatch
    const parsedInfo = useSelectAtom(fileAtom, file => file.parsedInfo)
    const path = useSelectAtom(fileAtom, file => file.path)
    const setFileLocked = useFocusSetAtom(fileAtom, "locked")
    const setFileMediaId = useFocusSetAtom(fileAtom, "mediaId")

    const episodeData = aniZipData?.episodes[String(Number(parsedInfo?.episode))]
    const fileTitle = parsedInfo?.original?.replace(/.(mkv|mp4)/, "")?.replaceAll(/(\[)[a-zA-Z0-9 ._~-]+(\])/ig, "")?.replaceAll(/[_,-]/g, " ")

    let title = fileTitle || "???"
    if (parsedInfo?.episode) title = `Episode ${parsedInfo.episode}`
    if (media.format === "MOVIE" && parsedInfo?.title) title = parsedInfo.title

    if (mediaID !== media.id) return null

    return (
        <div className={"border border-[--border] p-4 pr-12 rounded-lg relative transition hover:bg-gray-900"}>

            <div
                className={"flex gap-4 relative cursor-pointer"}
                onClick={async () => onPlayFile(path)}
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
                    <p className={"text-sm text-[--muted]"}>{parsedInfo?.original?.replace(/.(mkv|mp4)/, "")?.replaceAll(/(\[)[a-zA-Z0-9 ._~-]+(\])/ig, "")?.replaceAll(/[_,-]/g, " ")}</p>
                </div>
            </div>

            <div className={"absolute right-1 top-1 flex flex-col items-center"}>
                <EpisodeItemLockButton fileAtom={fileAtom}/>

                <DropdownMenu trigger={
                    <IconButton
                        icon={<BiDotsHorizontal/>}
                        intent={"gray-basic"}
                        size={"xs"}
                    />
                }>
                    <DropdownMenu.Item
                        onClick={() => {
                            startTransition(() => {
                                setFileMediaId(null)
                                setFileLocked(false)
                            })
                        }}
                    >Un-match</DropdownMenu.Item>
                </DropdownMenu>
            </div>
        </div>
    )
})

export const EpisodeItemLockButton = (props: { fileAtom: PrimitiveAtom<LocalFile> }) => {
    const locked = useSelectAtom(props.fileAtom, file => file.locked)
    const setFileLocked = useFocusSetAtom(props.fileAtom, "locked")

    return (
        <>
            <IconButton
                icon={locked ? <VscVerified/> : <BiLockOpenAlt/>}
                intent={locked ? "success-basic" : "warning-basic"}
                size={"md"}
                className={"hover:opacity-60"}
                onClick={() => setFileLocked(prev => !prev)}
            />
        </>
    )
}

export const UtilityButtons = (props: { entryAtom: PrimitiveAtom<LibraryEntry> }) => {

    const { settings } = useSettings()

    const sharedPath = useSelectAtom(props.entryAtom, entry => entry.sharedPath)

    return (
        <>
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
                    await openDirectoryInExplorer(sharedPath, await type())
                    setTimeout(() => {
                        toast.remove(tID)
                    }, 1000)
                }}
            />
        </>
    )
}

const ToggleLockStatusButton = (props: { entryAtom: PrimitiveAtom<LibraryEntry> }) => {

    const files = useSelectAtom(props.entryAtom, entry => entry.files)
    const mediaId = useSelectAtom(props.entryAtom, entry => entry.media.id)
    const allFilesLocked = files.every(file => file.locked)
    const setFiles = useSetLocalFiles()

    return (
        <Tooltip trigger={
            <IconButton
                icon={allFilesLocked ? <VscVerified/> : <BiLockOpenAlt/>}
                intent={allFilesLocked ? "success-subtle" : "warning-subtle"}
                size={"xl"}
                className={"hover:opacity-60"}
                onClick={() => {
                    startTransition(() => {
                        setFiles(draft => {
                            for (const draftFile of draft) {
                                if (draftFile.mediaId === mediaId) {
                                    draftFile.locked = !allFilesLocked
                                }
                            }
                            return
                        })
                    })
                }}
            />
        }>
            {allFilesLocked ? "Unlock all files" : "Lock all files"}
        </Tooltip>
    )
}
