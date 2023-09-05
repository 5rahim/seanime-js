import React, { startTransition, useMemo } from "react"
import { PrimitiveAtom } from "jotai"
import { LocalFile } from "@/lib/local-library/local-file"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useFocusSetAtom, useSelectAtom } from "@/atoms/helpers"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { IconButton } from "@/components/ui/button"
import { BiDotsHorizontal } from "@react-icons/all-files/bi/BiDotsHorizontal"
import { VscVerified } from "@react-icons/all-files/vsc/VscVerified"
import { BiLockOpenAlt } from "@react-icons/all-files/bi/BiLockOpenAlt"
import { ConsumetAnimeEpisodeData } from "@/lib/consumet/types"
import { valueContainsNC, valueContainsSpecials } from "@/lib/local-library/utils"
import { EpisodeListItem } from "@/components/shared/episode-list-item"

export const EpisodeItem = React.memo((props: {
    fileAtom: PrimitiveAtom<LocalFile>,
    aniZipData?: AniZipData,
    onPlayFile: (path: string) => void
    media: AnilistDetailedMedia
    consumetEpisodeData?: ConsumetAnimeEpisodeData
}) => {

    const { fileAtom, aniZipData, onPlayFile, media, consumetEpisodeData } = props

    const mediaID = useSelectAtom(fileAtom, file => file.mediaId) // Listen to changes in order to unmount when we unmatch
    const metadata = useSelectAtom(fileAtom, file => file.metadata)
    const parsedInfo = useSelectAtom(fileAtom, file => file.parsedInfo)
    const path = useSelectAtom(fileAtom, file => file.path)
    const setFileLocked = useFocusSetAtom(fileAtom, "locked")
    const setFileMediaId = useFocusSetAtom(fileAtom, "mediaId")

    const aniZipEpisode = aniZipData?.episodes[metadata.aniDBEpisodeNumber || String(metadata.episode)]
    const consumetEpisode = consumetEpisodeData?.find(n => Number(n.number) === metadata.episode)
    const fileTitle = useMemo(() => parsedInfo?.original?.replace(/.(mkv|mp4)/, "")?.replaceAll(/(\[)[a-zA-Z0-9 ._~-]+(\])/ig, "")?.replaceAll(/[_,-]/g, " "), [parsedInfo])

    const image = () => {
        if (!!path && (!valueContainsSpecials(path) && !valueContainsNC(path))) {
            return (consumetEpisode?.image || aniZipEpisode?.image)
        } else if (!!path) {
            return undefined
        }
        return (consumetEpisode?.image || aniZipEpisode?.image)
    }

    const displayedTitle = useMemo(() => {
        let _output = parsedInfo?.title || fileTitle || "???"
        if (!!metadata.episode) _output = `Episode ${metadata.episode}`
        if (media.format === "MOVIE" && parsedInfo?.title) _output = parsedInfo.title
        return _output
    }, [parsedInfo])

    if (mediaID !== media.id) return null

    return (
        <EpisodeListItem
            media={media}
            image={image()}
            onClick={async () => onPlayFile(path)}
            title={displayedTitle}
            showImagePlaceholder={!metadata.isNC}
            episodeTitle={aniZipEpisode?.title?.en || consumetEpisode?.title}
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