import { Slider } from "@/components/shared/slider"
import { PrimitiveAtom } from "jotai"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { AnifyAnimeEpisode } from "@/lib/anify/types"
import React, { useMemo } from "react"
import { useSelectAtom } from "@/atoms/helpers"
import { formatDistanceToNow, isBefore, subYears } from "date-fns"
import { LargeEpisodeListItem } from "@/components/shared/large-episode-list-item"
import { LocalFile } from "@/lib/local-library/types"
import { anizip_getEpisodeFromMetadata } from "@/lib/anizip/utils"
import { localFile_getDisplayTitle, localFile_getEpisodeCover } from "@/lib/local-library/utils/episode.utils"
import { AniZipData } from "@/lib/anizip/types"
import { anify_getEpisodeCover } from "@/lib/anify/utils"

type Props = {
    fileAtoms: PrimitiveAtom<LocalFile>[],
    aniZipData?: AniZipData,
    onPlayFile: (path: string) => void
    media: AnilistDetailedMedia
    anifyEpisodeData?: AnifyAnimeEpisode[]
}

export function EpisodeSectionSlider({ fileAtoms, ...rest }: Props) {

    return (
        <>
            <Slider>
                {fileAtoms.map(fileAtom => (
                    <Item
                        key={`${fileAtom}`}
                        fileAtom={fileAtom}
                        {...rest}
                    />
                ))}
            </Slider>
        </>
    )
}


type ItemProps = Omit<Props, "fileAtoms"> & { fileAtom: PrimitiveAtom<LocalFile> }

function Item({ fileAtom, aniZipData, anifyEpisodeData, onPlayFile, media }: ItemProps) {

    const metadata = useSelectAtom(fileAtom, file => file.metadata)
    const path = useSelectAtom(fileAtom, file => file.path)
    const parsedInfo = useSelectAtom(fileAtom, file => file.parsedInfo)

    const aniZipEpisode = anizip_getEpisodeFromMetadata(aniZipData, { metadata })
    const anifyEpisodeCover = anify_getEpisodeCover(anifyEpisodeData, metadata.episode)

    const date = aniZipEpisode?.airdate ? new Date(aniZipEpisode?.airdate) : undefined

    const image = useMemo(() => {
        return localFile_getEpisodeCover({ metadata }, aniZipEpisode?.image, anifyEpisodeCover, media.bannerImage || media.coverImage?.large)
    }, [metadata, anifyEpisodeCover, aniZipEpisode?.image])

    const mediaIsOlder = useMemo(() => date ? isBefore(date, subYears(new Date(), 2)) : undefined, [])

    const displayedTitle = useMemo(() => {
        return localFile_getDisplayTitle({ metadata, parsedInfo }, media)
    }, [parsedInfo, metadata])

    return (
        <LargeEpisodeListItem
            image={image}
            title={displayedTitle}
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
