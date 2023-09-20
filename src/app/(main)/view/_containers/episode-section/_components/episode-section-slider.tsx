import { Slider } from "@/components/shared/slider"
import { PrimitiveAtom } from "jotai"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { AnifyEpisodeCover } from "@/lib/anify/types"
import React, { useMemo } from "react"
import { useSelectAtom } from "@/atoms/helpers"
import { formatDistanceToNow, isBefore, subYears } from "date-fns"
import { LargeEpisodeListItem } from "@/components/shared/large-episode-list-item"
import { valueContainsNC, valueContainsSpecials } from "@/lib/local-library/utils"
import { LocalFile } from "@/lib/local-library/types"

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

    const mediaID = useSelectAtom(fileAtom, file => file.mediaId) // Listen to changes in order to unmount when we unmatch
    const metadata = useSelectAtom(fileAtom, file => file.metadata)
    const path = useSelectAtom(fileAtom, file => file.path)
    const fileName = useSelectAtom(fileAtom, file => file.name)
    const aniZipEpisode = aniZipData?.episodes[metadata.aniDBEpisodeNumber || String(metadata.episode)]
    const anifyEpisodeCover = anifyEpisodeCovers?.find(n => n.episode === metadata.episode)?.img

    const date = aniZipEpisode?.airdate ? new Date(aniZipEpisode?.airdate) : undefined

    const image = () => {
        if (!!fileName && (!valueContainsSpecials(fileName) && !valueContainsNC(fileName))) {
            return (anifyEpisodeCover || aniZipEpisode?.image || media.bannerImage || media.coverImage?.large)
        } else if (!!fileName) {
            return undefined
        }
        return (aniZipEpisode?.image || anifyEpisodeCover || media.bannerImage || media.coverImage?.large)
    }

    const mediaIsOlder = useMemo(() => date ? isBefore(date, subYears(new Date(), 2)) : undefined, [])

    return (
        <LargeEpisodeListItem
            image={image()}
            title={(media.format === "MOVIE" && metadata.episode === 1) ? "Complete movie" : (!!metadata.episode ? `Episode ${metadata.episode}` : media.title?.userPreferred || "")}
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
