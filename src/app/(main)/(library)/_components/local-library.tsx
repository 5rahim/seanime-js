"use client"
import React from "react"

interface LocalLibraryProps {
    children?: React.ReactNode
}

export const LocalLibrary: React.FC<LocalLibraryProps> = (props) => {

    const { children, ...rest } = props

    return (
        <>
            LocalLibrary
        </>
    )

}
