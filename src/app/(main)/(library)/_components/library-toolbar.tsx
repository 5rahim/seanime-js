"use client"

import React from "react"
import { useSettings } from "@/atoms/settings"
import { Button } from "@/components/ui/button"
import { openLocalDirectoryInExplorer } from "@/lib/helpers/directory"
import { type } from "@tauri-apps/api/os"
import toast from "react-hot-toast"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"
import { _toLocalFilesWithMedia, mock_testParsing, retrieveLocalFiles } from "@/lib/local-library/repository"
import { useStoredLocalFiles } from "@/atoms/library"
import { IoReload } from "@react-icons/all-files/io5/IoReload"
import { useCurrentUser } from "@/atoms/user"

interface LibraryToolbarProps {
    children?: React.ReactNode
}

export const LibraryToolbar: React.FC<LibraryToolbarProps> = (props) => {

    const { children, ...rest } = props
    const { settings } = useSettings()
    const { user } = useCurrentUser()
    const { localFiles, storeLocalFiles } = useStoredLocalFiles()
    // const { refetchCollection, allUserMedia } = useStoredAnilistCollection()

    const handleOpenLocalDirectory = async () => {
        const tID = toast.loading("Opening")
        await openLocalDirectoryInExplorer(settings, await type())
        setTimeout(() => {
            toast.remove(tID)
        }, 1000)
    }

    // Scan and store local files
    const handleScanLibrary = async () => {
        const tID = toast.loading("Scanning")
        const res = (await retrieveLocalFiles(settings))
        if (res) {
            storeLocalFiles(res)
            toast.success("Library scanned")
        }
        console.log(res)
        toast.remove(tID)
    }

    // Create/update local library entries from scanned local files
    const handleRefreshEntries = async () => {
        const tID = toast.loading("Loading")
        // TODO: Invoke [handleScanLibrary]
        const res = (await _toLocalFilesWithMedia(settings, user?.name))
        console.log(res)
        toast.remove(tID)
    }

    return (
        <div className={"p-4"}>
            <div className={"p-2 border border-[--border] rounded-lg flex w-full gap-2"}>
                <Button onClick={handleRefreshEntries} intent={"success"} leftIcon={<IoReload/>}>
                    Refresh entries
                </Button>
                <Button onClick={handleScanLibrary} intent={"primary"} leftIcon={<BiFolder/>}>
                    Scan library
                </Button>
                <Button onClick={handleOpenLocalDirectory} intent={"gray-outline"} leftIcon={<BiFolder/>}>
                    Open folder
                </Button>
                <Button
                    onClick={async () => {
                        console.log((await mock_testParsing(settings)))
                    }}
                >Mock</Button>
                {/*<Button onClick={() => {*/}
                {/*    console.log(snapshot2.map(n => _.omit(n, "parsedInfo", "parsedFolders")))*/}
                {/*}} intent={"gray-outline"} leftIcon={<BiFolder/>}>*/}
                {/*    Open folder*/}
                {/*</Button>*/}
                {/*<Button onClick={refetchCollection} intent={"gray-outline"}>*/}
                {/*    Refetch Anilist Collection*/}
                {/*</Button>*/}
            </div>
        </div>
    )

}
