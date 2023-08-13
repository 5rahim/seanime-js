"use client"

import React from "react"
import { useSettings } from "@/atoms/settings"
import { Button } from "@/components/ui/button"
import { openLocalDirectoryInExplorer } from "@/lib/helpers/directory"
import { type } from "@tauri-apps/api/os"
import toast from "react-hot-toast"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"
import { retrieveLocalFiles } from "@/lib/local-library/repository"

interface LibraryToolbarProps {
    children?: React.ReactNode
}

export const LibraryToolbar: React.FC<LibraryToolbarProps> = (props) => {

    const { children, ...rest } = props
    const { settings } = useSettings()

    const handleOpenLocalDirectory = async () => {
        const tID = toast.loading("Opening")
        await openLocalDirectoryInExplorer(settings, await type())
        setTimeout(() => {
            toast.remove(tID)
        }, 1000)
    }

    const handleScanLibrary = async () => {
        const tID = toast.loading("Scanning")
        const res = (await retrieveLocalFiles(settings))
        console.log(res)
        toast.remove(tID)
    }

    return (
        <div className={"p-4"}>
            <div className={"p-2 border border-[--border] rounded-lg flex w-full gap-2"}>
                <Button onClick={handleScanLibrary} intent={"primary"} leftIcon={<BiFolder/>}>
                    Scan library
                </Button>
                <Button onClick={handleOpenLocalDirectory} intent={"gray-outline"} leftIcon={<BiFolder/>}>
                    Open folder
                </Button>
            </div>
        </div>
    )

}
