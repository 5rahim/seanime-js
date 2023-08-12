"use client"

import React from "react"
import { useSettings } from "@/atoms/settings"
import { Button } from "@/components/ui/button"
import { openLocalDirectory } from "@/lib/helpers/directory"
import { type } from "@tauri-apps/api/os"
import toast from "react-hot-toast"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"

interface LibraryToolbarProps {
    children?: React.ReactNode
}

export const LibraryToolbar: React.FC<LibraryToolbarProps> = (props) => {

    const { children, ...rest } = props
    const { settings } = useSettings()

    const handleOpenLocalDirectory = async () => {
        const tID = toast.loading("Opening")
        await openLocalDirectory(settings, await type())
        toast.remove(tID)
    }

    return (
        <div className={"p-4"}>
            <div className={"p-2 border border-[--border] rounded-lg flex w-full "}>
                <Button onClick={handleOpenLocalDirectory} intent={"gray-outline"} leftIcon={<BiFolder/>}>Open
                    folder</Button>
            </div>
        </div>
    )

}
