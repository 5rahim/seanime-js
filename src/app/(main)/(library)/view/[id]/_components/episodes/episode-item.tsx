import React, { startTransition, useMemo } from "react"
import { PrimitiveAtom } from "jotai/index"
import { LocalFile } from "@/lib/local-library/local-file"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useFocusSetAtom, useSelectAtom } from "@/atoms/helpers"
import Image from "next/image"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { IconButton } from "@/components/ui/button"
import { BiDotsHorizontal } from "@react-icons/all-files/bi/BiDotsHorizontal"
import { VscVerified } from "@react-icons/all-files/vsc/VscVerified"
import { BiLockOpenAlt } from "@react-icons/all-files/bi/BiLockOpenAlt"

export const EpisodeItem = React.memo((props: {
    fileAtom: PrimitiveAtom<LocalFile>,
    aniZipData?: AniZipData,
    onPlayFile: (path: string) => void
    media: AnilistDetailedMedia
}) => {

    const { fileAtom, aniZipData, onPlayFile, media } = props

    const mediaID = useSelectAtom(fileAtom, file => file.mediaId) // Listen to changes in order to unmount when we unmatch
    const metadata = useSelectAtom(fileAtom, file => file.metadata)
    const parsedInfo = useSelectAtom(fileAtom, file => file.parsedInfo)
    const path = useSelectAtom(fileAtom, file => file.path)
    const setFileLocked = useFocusSetAtom(fileAtom, "locked")
    const setFileMediaId = useFocusSetAtom(fileAtom, "mediaId")

    const episodeData = useMemo(() => aniZipData?.episodes[metadata.aniDBEpisodeNumber || String(metadata.episode)], [])
    const fileTitle = useMemo(() => parsedInfo?.original?.replace(/.(mkv|mp4)/, "")?.replaceAll(/(\[)[a-zA-Z0-9 ._~-]+(\])/ig, "")?.replaceAll(/[_,-]/g, " "), [parsedInfo])

    const displayedTitle = useMemo(() => {
        let _output = parsedInfo?.title || fileTitle || "???"
        if (!!metadata.episode) _output = `Episode ${metadata.episode}`
        if (media.format === "MOVIE" && parsedInfo?.title) _output = parsedInfo.title
        return _output
    }, [parsedInfo])

    if (mediaID !== media.id) return null

    return (
        <EpisodeItemSkeleton
            media={media}
            image={episodeData?.image}
            onClick={async () => onPlayFile(path)}
            title={displayedTitle}
            showImagePlaceholder={!metadata.isNC}
            episodeTitle={episodeData?.title?.en}
            fileName={parsedInfo?.original?.replace(/.(mkv|mp4)/, "")?.replaceAll(/(\[)[a-zA-Z0-9 ._~-]+(\])/ig, "")?.replaceAll(/[_,-]/g, " ")}
            action={<>
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
                    <DropdownMenu.Item
                        onClick={() => {
                            // TODO: Open metadata modal
                        }}
                    >Update metadata</DropdownMenu.Item>
                </DropdownMenu>
            </>}
        />
    )
})

const EpisodeItemLockButton = (props: { fileAtom: PrimitiveAtom<LocalFile> }) => {
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

interface EpisodeItemSkeletonProps {
    media: AnilistDetailedMedia,
    children?: React.ReactNode
    action?: React.ReactNode
    image?: string | null
    onClick?: () => void
    title: string,
    episodeTitle?: string | null
    fileName?: string
    showImagePlaceholder?: boolean
}

export const EpisodeItemSkeleton: React.FC<EpisodeItemSkeletonProps> = (props) => {

    const { children, action, image, onClick, episodeTitle, title, fileName, ...rest } = props

    return <>
        <div className={"border border-[--border] p-4 pr-12 rounded-lg relative transition hover:bg-gray-900"}>
            <div
                className={"flex gap-4 relative cursor-pointer"}
                onClick={onClick}
            >
                {image && <div
                    className="h-24 w-24 flex-none rounded-md object-cover object-center relative overflow-hidden">
                    <Image
                        src={image}
                        alt={"episode image"}
                        fill
                        quality={60}
                        priority
                        sizes="10rem"
                        className="object-cover object-center"
                    />
                </div>}

                {(props.showImagePlaceholder && !image) && (
                    <div className={"h-24 w-24 rounded-md flex-none bg-gray-800 relative overflow-hidden"}>
                        {props.media.coverImage?.medium && <Image
                            src={props.media.coverImage?.medium}
                            alt={"episode image"}
                            fill
                            quality={60}
                            priority
                            sizes="10rem"
                            className="object-cover object-center"
                        />}
                    </div>
                )}

                <div className={"relative overflow-hidden"}>
                    <h4 className={"font-medium"}>{title}</h4>
                    {!!episodeTitle && <p className={"text-sm text-[--muted]"}>{episodeTitle}</p>}
                    {!!fileName && <p className={"text-sm text-gray-600 truncate text-ellipsis"}>{fileName}</p>}
                    {children && children}
                </div>
            </div>

            {action && <div className={"absolute right-1 top-1 flex flex-col items-center"}>
                {action}
            </div>}
        </div>
    </>

}
