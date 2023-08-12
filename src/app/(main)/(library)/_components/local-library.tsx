"use client"
import React, { useEffect } from "react"
import { retrieveLocalFiles } from "@/lib/local-library/repository"
import { useSettings } from "@/atoms/settings"

interface LocalLibraryProps {
    children?: React.ReactNode
}

export const LocalLibrary: React.FC<LocalLibraryProps> = (props) => {

    const { children, ...rest } = props

    const { settings } = useSettings()

    useEffect(() => {
        (async () => {
            console.log(await retrieveLocalFiles(settings))
        })()
    }, [])

    return (
        <>
            LocalLibrary
        </>
    )

}
