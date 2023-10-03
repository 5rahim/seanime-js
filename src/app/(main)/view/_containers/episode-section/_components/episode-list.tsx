import React from "react"
import { PrimitiveAtom } from "jotai"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { EpisodeItem } from "@/app/(main)/view/_containers/episode-section/_components/episode-item"
import { AnifyAnimeEpisodeData } from "@/lib/anify/types"
import { LocalFile } from "@/lib/local-library/types"

export const EpisodeList = React.memo((props: {
    fileAtoms: PrimitiveAtom<LocalFile>[],
    aniZipData?: AniZipData,
    onPlayFile: (path: string) => void
    media: AnilistDetailedMedia
    anifyEpisodeData?: AnifyAnimeEpisodeData[]
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
