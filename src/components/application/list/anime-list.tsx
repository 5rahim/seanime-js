"use client"
import React from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

export type AnimeListItem = {
    title: string
    imageSrc: string
    isAiring: boolean
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
                return (
                    <div className={"aspect-[6/7] block col-span-1 group/anime-list-item cursor-pointer"}>
                        <div
                            className="w-full h-full flex-none rounded-md border border-[--border] object-cover object-center relative overflow-hidden">
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
                            <p className={"text-center font-semibold text-sm"}>{item.title}</p>
                            <div className={"text-center"}>
                                {item.isAiring && <Badge intent={"primary"} className={"mx-auto"}>Airing</Badge>}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )

}
