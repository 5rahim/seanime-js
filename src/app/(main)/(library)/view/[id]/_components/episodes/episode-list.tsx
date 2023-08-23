import React from "react"
import { PrimitiveAtom } from "jotai/index"
import { LocalFile } from "@/lib/local-library/local-file"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { EpisodeItem } from "@/app/(main)/(library)/view/[id]/_components/episodes/episode-item"

export const EpisodeList = React.memo((props: {
    fileAtoms: PrimitiveAtom<LocalFile>[],
    aniZipData?: AniZipData,
    onPlayFile: (path: string) => void
    media: AnilistDetailedMedia
}) => {

    const { fileAtoms, ...rest } = props

    return (
        <div className={"grid grid-cols-2 gap-4"}>
            {fileAtoms.map(fileAtom => (
                <EpisodeItem key={`${fileAtom}`} fileAtom={fileAtom} {...rest} />
            ))}
        </div>
    )
})
