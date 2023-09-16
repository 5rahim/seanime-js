import React from "react"
import { PrimitiveAtom } from "jotai"
import { LocalFile } from "@/lib/local-library/local-file"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { EpisodeItem } from "@/app/(main)/view/_containers/episode-section/_components/episode-item"
import { AnifyEpisodeCover } from "@/lib/anify/types"

export const EpisodeList = React.memo((props: {
    fileAtoms: PrimitiveAtom<LocalFile>[],
    aniZipData?: AniZipData,
    onPlayFile: (path: string) => void
    media: AnilistDetailedMedia
    anifyEpisodeCovers?: AnifyEpisodeCover[]
}) => {

    const { fileAtoms, ...rest } = props

    return (
        <div className={"grid grid-cols-1 md:grid-cols-2 gap-4"}>
            {fileAtoms.map(fileAtom => (
                <EpisodeItem key={`${fileAtom}`} fileAtom={fileAtom} {...rest} />
            ))}
        </div>
    )
})
