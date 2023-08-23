import { PrimitiveAtom } from "jotai/index"
import { LibraryEntry } from "@/atoms/library/library-entry.atoms"
import { useSettings } from "@/atoms/settings"
import { useSelectAtom } from "@/atoms/helpers"
import { Tooltip } from "@/components/ui/tooltip"
import { IconButton } from "@/components/ui/button"
import { SiVlcmediaplayer } from "@react-icons/all-files/si/SiVlcmediaplayer"
import { VideoPlayer } from "@/lib/video-player"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"
import toast from "react-hot-toast"
import { openDirectoryInExplorer } from "@/lib/helpers/directory"
import { type } from "@tauri-apps/api/os"
import React from "react"

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
