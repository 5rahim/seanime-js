"use client"
import React, { useEffect } from "react"
import { retrieveLocalFiles } from "@/lib/local-library/repository"
import { useSettings } from "@/atoms/settings"
import toast from "react-hot-toast"

interface LocalLibraryProps {
    children?: React.ReactNode
}

export const LocalLibrary: React.FC<LocalLibraryProps> = (props) => {

    const { children, ...rest } = props

    const { settings } = useSettings()

    useEffect(() => {
        (async () => {
            const tID = toast.loading("Fetching")
            const res = (await retrieveLocalFiles(settings))
            console.log(res)
            toast.remove(tID)

        })()
    }, [])

    return (
        <>
            LocalLibrary
        </>
    )

}
