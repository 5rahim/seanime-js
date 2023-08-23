import React, { startTransition } from "react"
import { PrimitiveAtom } from "jotai/index"
import { LocalFile } from "@/lib/local-library/local-file"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useFocusSetAtom, useSelectAtom } from "@/atoms/helpers"
import { useNormalizedEpisodeNumber } from "@/app/(main)/(library)/view/[id]/_components/normalize-episode-number"
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
    const parsedInfo = useSelectAtom(fileAtom, file => file.parsedInfo)
    const path = useSelectAtom(fileAtom, file => file.path)
    const setFileLocked = useFocusSetAtom(fileAtom, "locked")
    const setFileMediaId = useFocusSetAtom(fileAtom, "mediaId")

    const normalizedEpisodeNumber = useNormalizedEpisodeNumber(parsedInfo, media)

    const episodeData = aniZipData?.episodes[String(normalizedEpisodeNumber ?? Number(parsedInfo?.episode))]
    const fileTitle = parsedInfo?.original?.replace(/.(mkv|mp4)/, "")?.replaceAll(/(\[)[a-zA-Z0-9 ._~-]+(\])/ig, "")?.replaceAll(/[_,-]/g, " ")

    let title = parsedInfo?.title || fileTitle || "???"
    if (episodeData?.episodeNumber || parsedInfo?.episode) title = `Episode ${episodeData?.episodeNumber ?? parsedInfo?.episode}`
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
                    <p className={"text-sm text-gray-600"}>{parsedInfo?.original?.replace(/.(mkv|mp4)/, "")?.replaceAll(/(\[)[a-zA-Z0-9 ._~-]+(\])/ig, "")?.replaceAll(/[_,-]/g, " ")}</p>
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
