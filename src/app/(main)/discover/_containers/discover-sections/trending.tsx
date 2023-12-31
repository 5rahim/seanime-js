import React, { useEffect, useMemo } from "react"
import { AnimeListItem } from "@/components/shared/anime-list-item"
import { Slider } from "@/components/shared/slider"
import { useDiscoverTrendingAnime } from "@/app/(main)/discover/_containers/discover-sections/_lib/queries"
import { atom } from "jotai/index"
import { AnilistShortMedia } from "@/lib/anilist/fragment"
import { AnimeSliderSkeletonItem } from "@/app/(main)/discover/_components/anime-slider-skeleton-item"
import { useSetAtom } from "jotai/react"

export const __discover_randomTrendingAtom = atom<AnilistShortMedia | undefined>(undefined)

export function DiscoverTrending() {

    const { data, isLoading, fetchNextPage } = useDiscoverTrendingAnime()
    const setRandomTrendingAtom = useSetAtom(__discover_randomTrendingAtom)

    const randomNumber = useMemo(() => Math.floor(Math.random() * 6), [])

    useEffect(() => {
        setRandomTrendingAtom(data?.pages?.flatMap(n => n.Page?.media).filter(Boolean)[randomNumber])
    }, [data])

    return (
        <Slider
            onSlideEnd={() => fetchNextPage()}
        >
            {!isLoading ? data?.pages?.flatMap(n => n.Page?.media).filter(Boolean).map(media => {
                return (
                    <AnimeListItem
                        key={media.id}
                        mediaId={media.id}
                        media={media}
                        showLibraryBadge
                        containerClassName={"min-w-[250px] max-w-[250px] mt-8"}
                    />
                )
            }) : [...Array(10).keys()].map((v, idx) => <AnimeSliderSkeletonItem key={idx}/>)}
        </Slider>
    )

}
