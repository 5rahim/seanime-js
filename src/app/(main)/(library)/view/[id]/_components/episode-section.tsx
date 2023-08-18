"use client"
import React from "react"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useLibraryEntry } from "@/atoms/library"

interface EpisodeSectionProps {
    children?: React.ReactNode
    detailedMedia: AnilistDetailedMedia
    aniZipData: AniZipData
}

export const EpisodeSection: React.FC<EpisodeSectionProps> = (props) => {

    const { children, detailedMedia, aniZipData, ...rest } = props

    const { entry, sortedFiles, watchOrderFiles } = useLibraryEntry(detailedMedia.id)

    const isMovie = detailedMedia.format === "MOVIE"

    if (!entry) {
        return <div>
            Not in your library
        </div>
    }

    return (
        <div>
            <div className={"mb-8"}>
                <h2>{isMovie ? "Movie" : "Episodes"}</h2>
            </div>
            {/*<pre>{JSON.stringify(aniZipData, null, 2)}</pre>*/}
            <div className={"grid grid-cols-2 gap-4"}>
                {watchOrderFiles.toWatch.map(file => {

                    const episodeData = aniZipData?.episodes[String(Number(file.parsedInfo?.episode))]

                    return (
                        <div key={file.path} className={"border border-[--border] p-4 rounded-lg"}>
                            <h4 className={"font-medium"}>{isMovie ? file.parsedInfo?.title : `Episode ${file.parsedInfo?.episode}`}</h4>
                            <p className={"text-sm text-[--muted]"}>{episodeData?.title?.en}</p>
                            <p className={"text-sm text-[--muted]"}>{file.parsedInfo?.original?.replace(/.(mkv|mp4)/, "")?.replaceAll(/(\[)[a-zA-Z0-9 ._~-]+(\])/ig, "")?.replaceAll(/[_,-]/g, " ")}</p>
                        </div>
                    )
                })}
            </div>
            -------
            <div>
                {watchOrderFiles.watched.reverse().map(file => {
                    return (
                        <div key={file.path}>
                            {file.name}
                        </div>
                    )
                })}
            </div>
        </div>
    )

}
