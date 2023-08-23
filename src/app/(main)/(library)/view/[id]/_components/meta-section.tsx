"use client"
import React from "react"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { BiCalendarAlt } from "@react-icons/all-files/bi/BiCalendarAlt"
import _ from "lodash"
import { useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist-collection"
import { ProgressBadge } from "@/app/(main)/(library)/view/[id]/_components/meta/progress-badge"
import { NextAiringEpisode } from "@/app/(main)/(library)/view/[id]/_components/meta/next-airing-episode"
import { DownloadPageButton } from "@/app/(main)/(library)/view/[id]/_components/meta/download-page-button"
import { useLibraryEntryAtomByMediaId } from "@/atoms/library/library-entry.atoms"

interface MetaSectionProps {
    children?: React.ReactNode
    detailedMedia: AnilistDetailedMedia
}

export const MetaSection: React.FC<MetaSectionProps> = (props) => {

    const { children, detailedMedia, ...rest } = props

    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(detailedMedia.id)
    const entryAtom = useLibraryEntryAtomByMediaId(detailedMedia.id)

    return (
        <>
            <div className={"space-y-8"}>
                <div className={"space-y-2"}>
                    <h1 className={"[text-shadow:_0_1px_10px_rgb(0_0_0_/_20%)]"}>{detailedMedia.title?.english}</h1>

                    {!!detailedMedia.season ? (
                            <div>
                                <p className={"text-lg text-gray-200 flex w-full gap-1 items-center"}>
                                    <BiCalendarAlt/> {new Intl.DateTimeFormat("en-US", {
                                    year: "numeric",
                                    month: "short",
                                }).format(new Date(detailedMedia.startDate?.year || 0, detailedMedia.startDate?.month || 0))} - {_.capitalize(detailedMedia.season ?? "")}
                                </p>
                            </div>
                        ) :
                        (
                            <p className={"text-lg text-gray-200 flex w-full gap-1 items-center"}>
                                Not yet released
                            </p>
                        )}

                    {collectionEntryAtom &&
                        <ProgressBadge collectionEntryAtom={collectionEntryAtom} episodes={detailedMedia.episodes}/>}

                    <p className={"max-h-24 overflow-y-auto"}>{detailedMedia.description?.replace(/(<([^>]+)>)/ig, "")}</p>
                </div>

                {/*Avoid "rendered fewer hooks than expected" error*/}
                {!!entryAtom && <DownloadPageButton entryAtom={entryAtom} collectionEntryAtom={collectionEntryAtom}
                                                    detailedMedia={detailedMedia}/>}
                {!entryAtom && <DownloadPageButton entryAtom={entryAtom} collectionEntryAtom={collectionEntryAtom}
                                                   detailedMedia={detailedMedia}/>}

                <NextAiringEpisode detailedMedia={detailedMedia}/>

                {/*TODO: Sequels Prequels*/}

            </div>
        </>
    )

}
