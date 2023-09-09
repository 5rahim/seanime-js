"use client"
import React from "react"

interface UndownloadedEpisodesProps {
    children?: React.ReactNode
}

export const UndownloadedEpisodes: React.FC<UndownloadedEpisodesProps> = (props) => {

    const { children, ...rest } = props

    // 1. currently watching
    // 2. Map them in subcomponents, useDownloadPageData() for each and list new episodes with download button

    return (
        <div>
            UndownloadedEpisodes
        </div>
    )

}
