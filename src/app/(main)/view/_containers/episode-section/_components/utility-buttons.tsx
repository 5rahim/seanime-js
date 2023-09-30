import { Atom } from "jotai"
import { LibraryEntry } from "@/atoms/library/library-entry.atoms"
import { useSettings } from "@/atoms/settings"
import { useSelectAtom } from "@/atoms/helpers"
import { IconButton } from "@/components/ui/button"
import { VideoPlayerRepository } from "@/lib/video-player"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"
import toast from "react-hot-toast"
import { openDirectoryInExplorer } from "@/lib/helpers/directory"
import React from "react"
import { useSetLocalFiles } from "@/atoms/library/local-file.atoms"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { BiDotsVerticalRounded } from "@react-icons/all-files/bi/BiDotsVerticalRounded"
import { ConfirmationDialog, useConfirmationDialog } from "@/components/application/confirmation-dialog"
import {
    __useEpisodeOffsetAction,
} from "@/app/(main)/view/_containers/episode-section/_components/bulk-actions/episode-offset-action"

export const UtilityButtons = (props: { entryAtom: Atom<LibraryEntry> }) => {

    const { settings } = useSettings()

    const sharedPath = useSelectAtom(props.entryAtom, entry => entry.sharedPath)
    const mediaId = useSelectAtom(props.entryAtom, entry => entry.media.id)
    const setLocalFiles = useSetLocalFiles()

    const confirmUnmatch = useConfirmationDialog({
        title: "Unmatch all files",
        description: "Are you sure you want to unmatch all files?",
        onConfirm: () => {
            setLocalFiles(draft => {
                for (const draftFile of draft) {
                    if (draftFile.mediaId === mediaId) {
                        draftFile.locked = false
                        draftFile.ignored = false
                        draftFile.mediaId = null
                        draftFile.metadata = {}
                    }
                }
                return
            })
        },
    })

    const { openEpisodeOffsetActionModal } = __useEpisodeOffsetAction()

    return (
        <>
            <IconButton
                icon={<BiFolder/>}
                intent={"gray-basic"}
                size={"xl"}
                className={"hover:opacity-60"}
                onClick={async () => {
                    const tID = toast.loading("Opening")
                    await openDirectoryInExplorer(sharedPath)
                    setTimeout(() => {
                        toast.remove(tID)
                    }, 1000)
                }}
            />
            <DropdownMenu trigger={<IconButton icon={<BiDotsVerticalRounded/>} intent={"gray-basic"} size={"xl"}/>}>
                <DropdownMenu.Item
                    onClick={async () => {
                        await VideoPlayerRepository(settings).start()
                    }}
                >
                    Start video player
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    onClick={confirmUnmatch.open}
                >
                    Unmatch all files
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    onClick={() => openEpisodeOffsetActionModal({ mediaId })}
                >
                    Offset episode numbers
                </DropdownMenu.Item>
            </DropdownMenu>


            <ConfirmationDialog {...confirmUnmatch} />
        </>
    )
}
