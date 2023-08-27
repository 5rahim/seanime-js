import { PrimitiveAtom } from "jotai"
import { LibraryEntry } from "@/atoms/library/library-entry.atoms"
import { useSettings } from "@/atoms/settings"
import { useSelectAtom } from "@/atoms/helpers"
import { IconButton } from "@/components/ui/button"
import { VideoPlayerRepository } from "@/lib/video-player"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"
import toast from "react-hot-toast"
import { openDirectoryInExplorer } from "@/lib/helpers/directory"
import { type } from "@tauri-apps/api/os"
import React from "react"
import { useSetLocalFiles } from "@/atoms/library/local-file.atoms"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { BiDotsVerticalRounded } from "@react-icons/all-files/bi/BiDotsVerticalRounded"

export const UtilityButtons = (props: { entryAtom: PrimitiveAtom<LibraryEntry> }) => {

    const { settings } = useSettings()

    const sharedPath = useSelectAtom(props.entryAtom, entry => entry.sharedPath)
    const mediaId = useSelectAtom(props.entryAtom, entry => entry.media.id)
    const setLocalFiles = useSetLocalFiles()

    return (
        <>
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
            <DropdownMenu trigger={<IconButton icon={<BiDotsVerticalRounded/>} intent={"gray-basic"} size={"xl"}/>}>
                <DropdownMenu.Item
                    onClick={async () => {
                        await VideoPlayerRepository(settings).start()
                    }}
                >
                    Start video player
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    onClick={() => {
                        setLocalFiles(draft => {
                            for (const draftFile of draft) {
                                if (draftFile.mediaId === mediaId) {
                                    draftFile.locked = false
                                    draftFile.ignored = false
                                    draftFile.mediaId = null
                                }
                            }
                            return
                        })
                    }}
                >
                    Un-match all files
                </DropdownMenu.Item>
            </DropdownMenu>
        </>
    )
}
