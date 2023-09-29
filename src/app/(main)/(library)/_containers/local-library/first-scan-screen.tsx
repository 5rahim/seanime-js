"use client"
import React from "react"
import { useSelectAtom } from "@/atoms/helpers"
import { localFilesAtom } from "@/atoms/library/local-file.atoms"

interface FirstScanScreenProps {
    children?: React.ReactNode
}

export const FirstScanScreen: React.FC<FirstScanScreenProps> = (props) => {

    const { children, ...rest } = props

    const localFileCount = useSelectAtom(localFilesAtom, files => files.length)

    if (localFileCount > 0) return null

    return (
        <div className={"text-center space-y-8 p-4 pt-0"}>
            <div className={"space-y-2"}>
                <h2>Scan your library</h2>
                <p>You have two options.</p>
            </div>
        </div>
    )

}
