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

export type AnimeListItem = {
    // id: string | null | undefined,
    // title: string
    // imageSrc: string
    // isAiring: boolean
    media: Nullish<AnilistMedia>
    isInLocalLibrary?: boolean
    progress?: { watched: number, total: Nullish<number> }
    score?: Nullish<number>
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
                        className={"h-full col-span-1 group/anime-list-item cursor-pointer relative flex flex-col place-content-stretch"}
                    >
                        <div
                            className="aspect-[6/7] flex-none rounded-md border border-[--border] object-cover object-center relative overflow-hidden"
                        >

                            {item.media.status === "RELEASING" && <div className={"absolute z-10 right-1 top-1"}>
                                <Tooltip
                                    trigger={<Badge intent={"primary-solid"} size={"lg"}><RiSignalTowerLine/></Badge>}>
                                    Airing
                                </Tooltip>
                            </div>}

                            {item.media.status === "NOT_YET_RELEASED" && <div className={"absolute z-10 right-1 top-1"}>
                                <Tooltip
                                    trigger={<Badge intent={"warning-solid"} size={"lg"}><RiSignalTowerLine/></Badge>}>
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

                            {item.score !== undefined && <div className={"absolute z-10 right-1 bottom-1"}>
                                <div className={cn(
                                    "backdrop-blur-lg inline-flex items-center justify-center gap-1 w-12 h-7 rounded-full font-bold bg-opacity-70 drop-shadow-sm shadow-lg",
                                    scoreColor,
                                )}>
                                    <BiStar/> {score}
                                </div>
                            </div>}

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
                                className="object-cover object-center group-hover/anime-list-item:scale-105 transition"
                            />
                        </div>
                        <div className={"pt-2 space-y-2 flex flex-col justify-between h-full"}>
                            <div>
                                <p className={"text-center font-semibold text-sm min-[2000px]:text-lg"}>{item.media.title?.userPreferred}</p>
                            </div>
                            <div>
                                <div className={"flex gap-2 w-full justify-center items-center flex-wrap"}>
                                    {/*TODO Check if in local library*/}
                                    {isInLocalLibrary && <div>
                                        <Tooltip
                                            trigger={<Badge size={"lg"} intent={"warning"}><IoLibrarySharp/></Badge>}>
                                            In local library
                                        </Tooltip>
                                    </div>}
                                </div>
                                <div>
                                    <p className={"text-sm text-[--muted] inline-flex gap-1 items-center"}>
                                        <BiCalendarAlt/> {new Intl.DateTimeFormat("en-US", {
                                        year: "numeric",
                                        month: "short",
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
