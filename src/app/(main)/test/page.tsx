"use client"

import { unstable_LibraryEntry, useLibraryEntryAtoms } from "@/atoms/library/library-entry.atoms"
import { PrimitiveAtom } from "jotai"
import { useAtomValue } from "jotai/react"
import { selectAtom } from "jotai/utils"
import React, { useCallback, useEffect } from "react"
import deepEquals from "fast-deep-equal"
import Image from "next/image"
import { BiCalendarAlt } from "@react-icons/all-files/bi/BiCalendarAlt"
import _ from "lodash"
import { Tooltip } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { RiSignalTowerLine } from "@react-icons/all-files/ri/RiSignalTowerLine"
import { cn } from "@/components/ui/core"
import { addSeconds, formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BiPlay } from "@react-icons/all-files/bi/BiPlay"
import { BiBookmarkPlus } from "@react-icons/all-files/bi/BiBookmarkPlus"

export default function Page() {

    const entryAtoms = useLibraryEntryAtoms()

    return (
        <div className={"px-4"}>
            <div className={"grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"}>
                {entryAtoms.map(entryAtom => {
                    return <AnimeItem key={`${entryAtom}`} entryAtom={entryAtom}/>
                })}
            </div>
        </div>
    )
}

// TODO

function AnimeItem(props: { entryAtom: PrimitiveAtom<unstable_LibraryEntry> }) {

    const { entryAtom } = props

    // const

    const media = useAtomValue(
        selectAtom(
            entryAtom,
            useCallback(entry => entry.media, []),
            deepEquals,
        ),
    )

    useEffect(() => {
        console.log(`${entryAtom}`, "item re-rendered")
    })

    return (
        <div
            className={"h-full col-span-1 group/anime-list-item relative flex flex-col place-content-stretch focus-visible:outline-0"}>

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
                            {!!media.bannerImage ? <Image
                                src={media.bannerImage || ""}
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
                                <p className={"text-center font-medium text-sm min-[2000px]:text-lg px-4 truncate text-ellipsis"}>{media.title?.userPreferred}</p>
                            }>{media.title?.userPreferred}</Tooltip>
                        </div>
                        {!!media.season ? <div>
                                <p className={"justify-center text-sm text-[--muted] flex w-full gap-1 items-center"}>
                                    <BiCalendarAlt/> {new Intl.DateTimeFormat("en-US", {
                                    year: "numeric",
                                    month: "short",
                                }).format(new Date(media.startDate?.year || 0, media.startDate?.month || 0))} - {_.capitalize(media.season ?? "")}
                                </p>
                            </div> :
                            <p className={"justify-center text-sm text-[--muted] flex w-full gap-1 items-center"}>Not
                                yet released</p>}
                        {!!media.nextAiringEpisode && (
                            <div className={"flex gap-1 items-center justify-center"}>
                                <p className={"text-xs min-[2000px]:text-md"}>Next episode:</p>
                                <Tooltip
                                    tooltipClassName={"bg-gray-200 text-gray-800 font-semibold mb-1"}
                                    trigger={
                                        <p className={"text-justify font-normal text-xs min-[2000px]:text-md"}>
                                            <Badge
                                                size={"sm"}>{media.nextAiringEpisode?.episode}</Badge>
                                        </p>
                                    }>{formatDistanceToNow(addSeconds(new Date(), media.nextAiringEpisode?.timeUntilAiring), { addSuffix: true })}{}</Tooltip>
                            </div>
                        )}

                        {/*PLAY BUTTON*/}
                        {/*TODO: Check if episode in library, if not show add button*/}
                        {false ? <div>
                            <div className={"py-1"}>
                                <Link href={`/view/${media.id}`}>
                                    <Button leftIcon={<BiPlay/>} intent={"white"} size={"md"}
                                            className={"w-full"}>Watch</Button>
                                </Link>
                            </div>
                        </div> : (media.status === "RELEASING" || media.status === "FINISHED") ? (
                            <div className={"py-1"}>
                                {/*This button will add the anime into the local library*/}
                                <Link href={`/view/${media.id}`}>
                                    <Button leftIcon={<BiBookmarkPlus/>} intent={"warning-subtle"}
                                            size={"sm"}
                                            className={"w-full"}>Add to library</Button>
                                </Link>
                            </div>
                        ) : null}

                    </div>
                    <div className={"space-y-2"}>
                        {/*TODO ACTION*/}
                    </div>
                </div>
            </div>

            <div
                className="aspect-[6/7] flex-none rounded-md border border-[--border] object-cover object-center relative overflow-hidden"
            >

                {/*RELEASING BADGE*/}
                {media.status === "RELEASING" && <div className={"absolute z-10 right-1 top-1"}>
                    <Tooltip
                        trigger={<Badge intent={"primary-solid"} size={"lg"}><RiSignalTowerLine/></Badge>}>
                        Airing
                    </Tooltip>
                </div>}

                {/*NOT YET RELEASED BADGE*/}
                {media.status === "NOT_YET_RELEASED" && <div className={"absolute z-10 right-1 top-1"}>
                    <Tooltip
                        trigger={<Badge intent={"gray-solid"} size={"lg"}><RiSignalTowerLine/></Badge>}>
                        {!!media.startDate?.year ?
                            new Intl.DateTimeFormat("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            }).format(new Date(media.startDate.year, media.startDate?.month || 0, media.startDate?.day || 0))
                            : "Not yet released"
                        }
                    </Tooltip>
                </div>}

                <Image
                    src={media.coverImage?.large || ""}
                    alt={""}
                    fill
                    quality={100}
                    sizes="20rem"
                    className="object-cover object-center group-hover/anime-list-item:scale-125 transition"
                />
            </div>
            <div className={"pt-2 space-y-2 flex flex-col justify-between h-full"}>
                <div>
                    <p className={"text-center font-semibold text-sm min-[2000px]:text-lg"}>{media.title?.userPreferred}</p>
                </div>
                <div>
                    <div>
                        <p className={"text-sm text-[--muted] inline-flex gap-1 items-center"}>
                            <BiCalendarAlt/>{_.capitalize(media.season ?? "")} {new Intl.DateTimeFormat("en-US", {
                            year: "numeric",
                        }).format(new Date(media.startDate?.year || 0, media.startDate?.month || 0))}
                        </p>
                    </div>
                </div>
            </div>

        </div>
    )
}
