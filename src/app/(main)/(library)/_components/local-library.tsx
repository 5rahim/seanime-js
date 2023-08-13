"use client"
import React from "react"
import { useSettings } from "@/atoms/settings"

interface LocalLibraryProps {
    children?: React.ReactNode
}

export const LocalLibrary: React.FC<LocalLibraryProps> = (props) => {

    const { children, ...rest } = props

    const { settings } = useSettings()

    // useEffect(() => {
    //     ()()
    // }, [])

    return (
        <>
            LocalLibrary
        </>
    )

}
