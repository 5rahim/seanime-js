"use client"
import React from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { RiSignalTowerLine } from "@react-icons/all-files/ri/RiSignalTowerLine"
import { IoLibrarySharp } from "@react-icons/all-files/io5/IoLibrarySharp"
import { Tooltip } from "@/components/ui/tooltip"
import { cn } from "@/components/ui/core"
import { BiStar } from "@react-icons/all-files/bi/BiStar"
import { AnilistMedia } from "@/lib/anilist/fragment"
import { Nullish } from "@/types/common"
import { BiCalendarAlt } from "@react-icons/all-files/bi/BiCalendarAlt"
import { Button, IconButton } from "@/components/ui/button"
import { BiCalendarEdit } from "@react-icons/all-files/bi/BiCalendarEdit"
import { addSeconds, formatDistanceToNow } from "date-fns"
import _ from "lodash"
import { BiDownload } from "@react-icons/all-files/bi/BiDownload"
import { BiPlay } from "@react-icons/all-files/bi/BiPlay"
import { BiBookmarkPlus } from "@react-icons/all-files/bi/BiBookmarkPlus"
import Link from "next/link"

export type AnimeListItem = {
    // id: string | null | undefined,
    // title: string
    // imageSrc: string
    // isAiring: boolean
    media: Nullish<AnilistMedia>
    isInLocalLibrary?: boolean
    progress?: { watched: number, total: Nullish<number> }
    score?: Nullish<number>
    hideLibraryBadge?: boolean
    action?: React.ReactNode
}

interface AnimeListProps {
    children?: React.ReactNode
    items: AnimeListItem[]
}

export const AnimeList: React.FC<AnimeListProps> = (props) => {

    const { children, items, ...rest } = props

    return (
        <div className={"grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"}>
            {items.map(item => {
                if (!item.media || !item.media.id) return null
                const isInLocalLibrary = item.isInLocalLibrary || false
                const score = item.score ? String(item.score) : "-"
                const scoreColor = item.score ? (
                    item.score < 5 ? "bg-red-500" :
                        item.score < 7 ? "bg-orange-500" :
                            item.score < 9 ? "bg-green-500" :
                                "bg-brand-500 text-white bg-opacity-80"
                ) : ""
                return (
                    <div
                        key={item.media.id!}
                        className={"h-full col-span-1 group/anime-list-item relative flex flex-col place-content-stretch focus-visible:outline-0"}

                    >

                        {/*ACTION POPUP*/}
                        <div className={cn(
                            "absolute z-20 bg-gray-900 opacity-0 scale-70 border border-[--border]",
                            "group-hover/anime-list-item:opacity-100 group-hover/anime-list-item:scale-100",
                            "group-focus-visible/anime-list-item:opacity-100 group-focus-visible/anime-list-item:scale-100",
                            "focus-visible:opacity-100 focus-visible:scale-100",
                            "h-[105%] w-[100%] -top-[5%] rounded-md transition ease-in-out",
                            "focus-visible:ring-2 ring-brand-400 focus-visible:outline-0",
                        )} tabIndex={0}>
                            <div className={"p-2 h-full w-full flex flex-col justify-between"}>
                                {/*METADATA SECTION*/}
                                <div className={"space-y-1"}>
                                    <div className={"aspect-[4/2] relative rounded-md overflow-hidden mb-2"}>
                                        {!!item.media.bannerImage ? <Image
                                            src={item.media.bannerImage || ""}
                                            alt={""}
                                            fill
                                            quality={100}
                                            sizes="20rem"
                                            className="object-cover object-center transition"
                                        /> : <div
                                            className={"h-full block absolute w-full bg-gradient-to-t from-gray-800 to-transparent"}></div>}
                                    </div>
                                    <div>
                                        <Tooltip trigger={
                                            <p className={"text-center font-medium text-sm min-[2000px]:text-lg px-4 truncate text-ellipsis"}>{item.media.title?.userPreferred}</p>
                                        }>{item.media.title?.userPreferred}</Tooltip>
                                    </div>
                                    {!!item.media.season ? <div>
                                            <p className={"justify-center text-sm text-[--muted] flex w-full gap-1 items-center"}>
                                                <BiCalendarAlt/> {new Intl.DateTimeFormat("en-US", {
                                                year: "numeric",
                                                month: "short",
                                            }).format(new Date(item.media.startDate?.year || 0, item.media.startDate?.month || 0))} - {_.capitalize(item.media.season ?? "")}
                                            </p>
                                        </div> :
                                        <p className={"justify-center text-sm text-[--muted] flex w-full gap-1 items-center"}>Not
                                            yet released</p>}
                                    {!!item.media.nextAiringEpisode && (
                                        <div className={"flex gap-1 items-center justify-center"}>
                                            <p className={"text-xs min-[2000px]:text-md"}>Next episode:</p>
                                            <Tooltip
                                                tooltipClassName={"bg-gray-200 text-gray-800 font-semibold mb-1"}
                                                trigger={
                                                    <p className={"text-justify font-normal text-xs min-[2000px]:text-md"}>
                                                        <Badge
                                                            size={"sm"}>{item.media.nextAiringEpisode?.episode}</Badge>
                                                    </p>
                                                }>{formatDistanceToNow(addSeconds(new Date(), item.media.nextAiringEpisode?.timeUntilAiring), { addSuffix: true })}{}</Tooltip>
                                        </div>
                                    )}

                                    {/*PLAY BUTTON*/}
                                    {/*TODO: Check if episode in library, if not show add button*/}
                                    {isInLocalLibrary ? <div>
                                        <div className={"py-1"}>
                                            <Link href={`/view/${item.media.id}`}>
                                                <Button leftIcon={<BiPlay/>} intent={"white"} size={"md"}
                                                        className={"w-full"}>Watch</Button>
                                            </Link>
                                        </div>
                                    </div> : (item.media.status === "RELEASING" || item.media.status === "FINISHED") ? (
                                        <div className={"py-1"}>
                                            {/*This button will add the anime into the local library*/}
                                            <Link href={`/view/${item.media.id}`}>
                                                <Button leftIcon={<BiBookmarkPlus/>} intent={"warning-subtle"}
                                                        size={"sm"}
                                                        className={"w-full"}>Add to library</Button>
                                            </Link>
                                        </div>
                                    ) : null}

                                </div>
                                <div className={"space-y-2"}>
                                    {item.action && item.action}
                                    <div className={"flex gap-1"}>
                                        <Tooltip trigger={<IconButton
                                            icon={<BiCalendarEdit/>}
                                            size={"sm"}
                                            intent={"gray-subtle"}/>}
                                        >
                                            Change watch dates
                                        </Tooltip>
                                        <Tooltip trigger={<IconButton
                                            icon={<BiStar/>}
                                            size={"sm"}
                                            intent={"gray-subtle"}/>}
                                        >
                                            Change score
                                        </Tooltip>
                                        <IconButton
                                            icon={<BiDownload/>}
                                            size={"sm"}
                                            intent={"warning-subtle"}/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            className="aspect-[6/7] flex-none rounded-md border border-[--border] object-cover object-center relative overflow-hidden"
                        >

                            {/*BOTTOM GRADIENT*/}
                            <div
                                className={"z-[5] absolute bottom-0 w-full h-[50%] bg-gradient-to-t from-black to-transparent"}/>

                            {/*IN LOCAL LIBRARY*/}
                            {(isInLocalLibrary && !item.hideLibraryBadge) &&
                                <div className={"absolute z-10 left-0 top-0"}>
                                    <Badge size={"xl"} intent={"warning-solid"}
                                           className={"rounded-md rounded-bl-none rounded-tr-none text-orange-900"}><IoLibrarySharp/></Badge>
                                </div>}

                            {/*RELEASING BADGE*/}
                            {item.media.status === "RELEASING" && <div className={"absolute z-10 right-1 top-1"}>
                                <Tooltip
                                    trigger={<Badge intent={"primary-solid"} size={"lg"}><RiSignalTowerLine/></Badge>}>
                                    Airing
                                </Tooltip>
                            </div>}

                            {/*NOT YET RELEASED BADGE*/}
                            {item.media.status === "NOT_YET_RELEASED" && <div className={"absolute z-10 right-1 top-1"}>
                                <Tooltip
                                    trigger={<Badge intent={"gray-solid"} size={"lg"}><RiSignalTowerLine/></Badge>}>
                                    {!!item.media.startDate?.year ?
                                        new Intl.DateTimeFormat("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        }).format(new Date(item.media.startDate.year, item.media.startDate?.month || 0, item.media.startDate?.day || 0))
                                        : "Not yet released"
                                    }
                                </Tooltip>
                            </div>}

                            {/*SCORE BADGE*/}
                            {item.score !== undefined && <div className={"absolute z-10 right-1 bottom-1"}>
                                <div className={cn(
                                    "backdrop-blur-lg inline-flex items-center justify-center gap-1 w-12 h-7 rounded-full font-bold bg-opacity-70 drop-shadow-sm shadow-lg",
                                    scoreColor,
                                )}>
                                    <BiStar/> {score}
                                </div>
                            </div>}

                            {/*PROGRESS BADGE*/}
                            {item.progress && <div className={"absolute z-10 left-1 bottom-1"}>
                                <Badge intent={"gray-solid"}
                                       className={"bg-gray-800 border dark:border-[--border] border-[--border]"}
                                       size={"lg"}>{`${item.progress.watched}/${item.progress.total || "-"}`}</Badge>
                            </div>}

                            <Image
                                src={item.media.coverImage?.large || ""}
                                alt={""}
                                fill
                                quality={100}
                                sizes="20rem"
                                className="object-cover object-center group-hover/anime-list-item:scale-125 transition"
                            />
                        </div>
                        <div className={"pt-2 space-y-2 flex flex-col justify-between h-full"}>
                            <div>
                                <p className={"text-center font-semibold text-sm min-[2000px]:text-lg"}>{item.media.title?.userPreferred}</p>
                            </div>
                            <div>
                                <div>
                                    <p className={"text-sm text-[--muted] inline-flex gap-1 items-center"}>
                                        <BiCalendarAlt/>{_.capitalize(item.media.season ?? "")} {new Intl.DateTimeFormat("en-US", {
                                        year: "numeric",
                                    }).format(new Date(item.media.startDate?.year || 0, item.media.startDate?.month || 0))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )

}
