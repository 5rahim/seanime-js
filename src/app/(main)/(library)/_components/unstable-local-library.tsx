"use client"
import React from "react"

interface UnstableLocalLibraryProps {
    children?: React.ReactNode
}

export const UnstableLocalLibrary: React.FC<UnstableLocalLibraryProps> = (props) => {

    const { children, ...rest } = props

    return (
        <>
            UnstableLocalLibrary
        </>
    )

}
