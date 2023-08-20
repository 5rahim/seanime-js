"use client"
import React from "react"

interface EpisodeItemProps {
    children?: React.ReactNode
}

export const EpisodeItem: React.FC<EpisodeItemProps> = (props) => {

    const { children, ...rest } = props

    return (
        <>
            EpisodeItem
        </>
    )

}
