"use client"
import React from "react"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { BiCalendarAlt } from "@react-icons/all-files/bi/BiCalendarAlt"
import _ from "lodash"
import { AnilistCollectionEntry, useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist-collection"
import { Tooltip } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { addSeconds, formatDistanceToNow } from "date-fns"
import { useSelectAtom } from "@/atoms/helpers"
import { PrimitiveAtom } from "jotai"

interface MetaSectionProps {
    children?: React.ReactNode
    detailedMedia: AnilistDetailedMedia
}

export const MetaSection: React.FC<MetaSectionProps> = (props) => {

    const { children, detailedMedia, ...rest } = props

    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(detailedMedia.id)

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
                    <div>tags</div>
                </div>

                {/*/!*TODO !!detailedMedia.nextAiringEpisode && episodeNotDownloaded*!/*/}
                {/*{detailedMedia.status !== "FINISHED" && <div className={"space-y-2"}>*/}
                {/*    /!*TODO Fetch info from torrent - If next episode is available and not in library*!/*/}
                {/*    <h4>*/}
                {/*        {!!mediaListEntry?.progress && mediaListEntry.progress > 0 ? "Episode X" : "Start watching!"}*/}
                {/*    </h4>*/}
                {/*    <Button intent={"white"} className={"w-full"} size={"lg"} leftIcon={<BiDownload/>}>Download next*/}
                {/*        episode (7)</Button>*/}
                {/*</div>}*/}

                {/*{(detailedMedia.status === "FINISHED" && !entry) && <div className={"space-y-2"}>*/}
                {/*    /!*TODO Fetch info from torrent - If no episodes in library*!/*/}
                {/*    <h4>{!!mediaListEntry?.status && (mediaListEntry.status === "PLANNING" ? "First watch!" : mediaListEntry.status === "COMPLETED" ? "Re-watch" : "Watch")}</h4>*/}
                {/*    <Button intent={"white"} className={"w-full"} size={"lg"}>Download batch</Button>*/}
                {/*</div>}*/}


                {!!detailedMedia.nextAiringEpisode && (
                    <div className={"flex gap-2 items-center justify-center"}>
                        <p className={"text-xl min-[2000px]:text-xl"}>Next episode:</p>
                        <Tooltip
                            tooltipClassName={"bg-gray-200 text-gray-800 font-semibold mb-1"}
                            trigger={
                                <p className={"text-justify font-normal text-xl min-[2000px]:text-xl"}>
                                    <Badge
                                        size={"lg"}>{detailedMedia.nextAiringEpisode?.episode}</Badge>
                                </p>
                            }>{formatDistanceToNow(addSeconds(new Date(), detailedMedia.nextAiringEpisode?.timeUntilAiring), { addSuffix: true })}{}</Tooltip>
                    </div>
                )}

            </div>
        </>
    )

}

export const ProgressBadge = (({ collectionEntryAtom, episodes }: {
    collectionEntryAtom: PrimitiveAtom<AnilistCollectionEntry>,
    episodes: number | null | undefined
}) => {

    const progress = useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress)

    if (!progress) return null

    return (
        <>
            <div className={""}>
                <Badge intent={"gray-solid"}
                       className={"bg-gray-800 border dark:border-[--border] border-[--border]"}
                       size={"xl"}>{`${progress}/${episodes || "-"}`}</Badge>
            </div>
        </>
    )
})
