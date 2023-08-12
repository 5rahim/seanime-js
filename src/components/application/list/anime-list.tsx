"use client"
import React from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { RiSignalTowerLine } from "@react-icons/all-files/ri/RiSignalTowerLine"
import { IoLibrarySharp } from "@react-icons/all-files/io5/IoLibrarySharp"
import { Tooltip } from "@/components/ui/tooltip"
import { cn } from "@/components/ui/core"

export type AnimeListItem = {
    id: string | null | undefined,
    title: string
    imageSrc: string
    isAiring: boolean
    isInLocalLibrary?: boolean
    progress?: { watched: number, total: number | null | undefined }
    score?: number | null | undefined
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
                const isInLocalLibrary = item.isInLocalLibrary || false
                const score = item.score ? String(item.score) : "-"
                const scoreColor = item.score ? (
                    item.score < 5 ? "bg-red-500" :
                        item.score < 7 ? "bg-orange-500" :
                            item.score < 9 ? "bg-green-500" :
                                "bg-brand-500 text-white bg-opacity-80"
                ) : ""
                return (
                    <div key={item.id || item.title}
                         className={"aspect-[6/7] block col-span-1 group/anime-list-item cursor-pointer"}>
                        <div
                            className="w-full h-full flex-none rounded-md border border-[--border] object-cover object-center relative overflow-hidden"
                        >
                            {item.isAiring && <div className={"absolute z-10 right-1 top-1"}>
                                <Tooltip
                                    trigger={<Badge intent={"primary-solid"} size={"lg"}><RiSignalTowerLine/></Badge>}>
                                    Airing
                                </Tooltip>
                            </div>}
                            {item.score !== undefined && <div className={"absolute z-10 right-1 bottom-1"}>
                                <div className={cn(
                                    "backdrop-blur-lg inline-flex items-center justify-center w-7 h-7 rounded-full font-bold bg-opacity-70 drop-shadow-sm shadow-lg",
                                    scoreColor,
                                )}>
                                    {score}
                                </div>
                            </div>}
                            <Image
                                src={item.imageSrc}
                                alt={""}
                                fill
                                quality={100}
                                priority
                                sizes="20rem"
                                className="object-cover object-center group-hover/anime-list-item:scale-105 transition"
                            />
                        </div>
                        <div className={"pt-2 space-y-2"}>
                            <p className={"text-center font-semibold text-sm min-[2000px]:text-lg"}>{item.title}</p>
                            <div className={"flex gap-2 w-full justify-center items-center flex-wrap"}>
                                {item.progress && <div>
                                    <Badge
                                        size={"lg"}>{`${item.progress.watched}/${item.progress.total || "-"}`}</Badge>
                                </div>}
                                {/*TODO Check if in local library*/}
                                {isInLocalLibrary && <div>
                                    <Tooltip trigger={<Badge size={"lg"} intent={"warning"}><IoLibrarySharp/></Badge>}>
                                        In local library
                                    </Tooltip>
                                </div>}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )

}
