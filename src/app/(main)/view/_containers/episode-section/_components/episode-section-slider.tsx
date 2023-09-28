import { Slider } from "@/components/shared/slider"
import { PrimitiveAtom } from "jotai"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { AnifyEpisodeCover } from "@/lib/anify/types"
import React, { useMemo } from "react"
import { useSelectAtom } from "@/atoms/helpers"
import { formatDistanceToNow, isBefore, subYears } from "date-fns"
import { LargeEpisodeListItem } from "@/components/shared/large-episode-list-item"
import { LocalFile } from "@/lib/local-library/types"
import { anizip_getEpisodeFromMetadata } from "@/lib/anizip/utils"
import { localFile_episodeExists, localFile_getEpisodeCover } from "@/lib/local-library/utils/episode.utils"

type Props = {
    fileAtoms: PrimitiveAtom<LocalFile>[],
    aniZipData?: AniZipData,
    onPlayFile: (path: string) => void
    media: AnilistDetailedMedia
    anifyEpisodeCovers?: AnifyEpisodeCover[]
}

export function EpisodeSectionSlider({ fileAtoms, ...rest }: Props) {
    return (
        <>
            <Slider>
                {fileAtoms.map(fileAtom => (
                    <Item key={`${fileAtom}`} fileAtom={fileAtom} {...rest} />
                ))}
            </Slider>
        </>
    )
}


type ItemProps = Omit<Props, "fileAtoms"> & { fileAtom: PrimitiveAtom<LocalFile> }

function Item({ fileAtom, aniZipData, anifyEpisodeCovers, onPlayFile, media }: ItemProps) {

    const metadata = useSelectAtom(fileAtom, file => file.metadata)
    const path = useSelectAtom(fileAtom, file => file.path)
    const aniZipEpisode = anizip_getEpisodeFromMetadata(aniZipData, { metadata })
    const anifyEpisodeCover = anifyEpisodeCovers?.find(n => n.episode === metadata.episode)?.img

    const date = aniZipEpisode?.airdate ? new Date(aniZipEpisode?.airdate) : undefined

    const image = useMemo(() => localFile_getEpisodeCover({ metadata }, aniZipEpisode?.image, anifyEpisodeCover, media.bannerImage || media.coverImage?.large), [metadata, anifyEpisodeCover, aniZipEpisode?.image])

    const mediaIsOlder = useMemo(() => date ? isBefore(date, subYears(new Date(), 2)) : undefined, [])

    return (
        <LargeEpisodeListItem
            image={image}
            title={(media.format === "MOVIE" && metadata.episode === 1) ? "Complete movie" : (localFile_episodeExists({ metadata }) ? `Episode ${metadata.episode}` : media.title?.userPreferred || "")}
            topTitle={!((media.format === "MOVIE" && metadata.episode === 1)) ? aniZipEpisode?.title?.en : ``}
            meta={(date) ? (!mediaIsOlder ? `${formatDistanceToNow(date, { addSuffix: true })}` : new Intl.DateTimeFormat("en-US", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
            }).format(date)) : undefined}
            onClick={() => {
                onPlayFile(path)
            }}
        />
    )
}
