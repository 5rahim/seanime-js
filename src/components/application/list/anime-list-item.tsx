import { useLibraryEntryAtomByMediaId } from "@/atoms/library/library-entry.atoms"
import { useAnilistCollectionEntryAtomByMediaId, useAnilistUserMedia } from "@/atoms/anilist-collection"
import React from "react"
import { cn } from "@/components/ui/core"
import Image from "next/image"
import { Tooltip } from "@/components/ui/tooltip"
import { BiCalendarAlt } from "@react-icons/all-files/bi/BiCalendarAlt"
import _ from "lodash"
import { Badge } from "@/components/ui/badge"
import { addSeconds, formatDistanceToNow } from "date-fns"
import { RiSignalTowerLine } from "@react-icons/all-files/ri/RiSignalTowerLine"
import Link from "next/link"
import { Button, IconButton } from "@/components/ui/button"
import { AnilistSimpleMedia } from "@/lib/anilist/fragment"
import { BiPlay } from "@react-icons/all-files/bi/BiPlay"
import { BiBookmarkPlus } from "@react-icons/all-files/bi/BiBookmarkPlus"
import { VscVerified } from "@react-icons/all-files/vsc/VscVerified"
import { BiLockOpenAlt } from "@react-icons/all-files/bi/BiLockOpenAlt"
import { useLocalFilesByMediaId, useSetLocalFiles } from "@/atoms/library/local-file.atoms"
import { BiStar } from "@react-icons/all-files/bi/BiStar"
import { useSelectAtom } from "@/atoms/helpers"

export const AnimeListItem = ((props: { mediaId: number }) => {

    const { mediaId } = props

    const media = useAnilistUserMedia(mediaId)

    if (!media) return <></>

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
                "focus-visible:ring-2 ring-brand-400 focus-visible:outline-0 ",
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
                            {/*<Tooltip trigger={*/}
                            {/*    <p className={"text-center font-medium text-sm min-[2000px]:text-lg px-4 truncate text-ellipsis"}>{media.title?.userPreferred}</p>*/}
                            {/*}>{media.title?.userPreferred}</Tooltip>*/}
                            <p className={"text-center font-medium text-sm min-[2000px]:text-lg px-4 truncate text-ellipsis"}>{media.title?.userPreferred}</p>
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

                        <MainActionButton media={media}/>

                    </div>
                    <div className={"space-y-2"}>
                        <LockFilesButton media={media}/>
                    </div>
                </div>
            </div>

            <div
                className="aspect-[6/7] flex-none rounded-md border border-[--border] object-cover object-center relative overflow-hidden"
            >

                {/*BOTTOM GRADIENT*/}
                <div
                    className={"z-[5] absolute bottom-0 w-full h-[50%] bg-gradient-to-t from-black to-transparent"}/>

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


                <ProgressBadge mediaId={media.id}/>
                <ScoreBadge mediaId={media.id}/>

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
})

const MainActionButton = (props: { media: AnilistSimpleMedia }) => {
    const entryAtom = useLibraryEntryAtomByMediaId(props.media.id)
    return (
        <>
            {!!entryAtom ? <div>
                <div className={"py-1"}>
                    <Link href={`/view/${props.media.id}`}>
                        <Button
                            leftIcon={<BiPlay/>}
                            intent={"white"}
                            size={"md"}
                            className={"w-full"}
                        >
                            Watch
                        </Button>
                    </Link>
                </div>
            </div> : (props.media.status === "RELEASING" || props.media.status === "FINISHED") ? (
                <div className={"py-1"}>
                    {/*This button will add the anime into the local library*/}
                    <Link href={`/view/${props.media.id}`}>
                        <Button
                            leftIcon={<BiBookmarkPlus/>}
                            intent={"warning-subtle"}
                            size={"sm"}
                            className={"w-full"}
                        >
                            Add to library
                        </Button>
                    </Link>
                </div>
            ) : null}
        </>
    )
}

const LockFilesButton = (props: { media: AnilistSimpleMedia }) => {

    const files = useLocalFilesByMediaId(props.media.id)
    const allFilesLocked = files.every(file => file.locked)
    const setFiles = useSetLocalFiles()

    if (files.length === 0) return null

    return (
        <Tooltip trigger={
            <IconButton
                icon={allFilesLocked ? <VscVerified/> : <BiLockOpenAlt/>}
                intent={allFilesLocked ? "success" : "warning-subtle"}
                size={"sm"}
                className={"hover:opacity-60"}
                onClick={() => setFiles(draft => {
                    for (const draftFile of draft) {
                        if (draftFile.mediaId === props.media.id) {
                            draftFile.locked = !allFilesLocked
                        }
                    }
                    return
                })
                }
            />
        }>
            {allFilesLocked ? "Unlock all files" : "Lock all files"}
        </Tooltip>
    )
}

const ScoreBadge = (props: { mediaId: number }) => {

    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(props.mediaId)
    const score = !!collectionEntryAtom ? useSelectAtom(collectionEntryAtom, entry => entry?.score) : undefined

    if (!collectionEntryAtom || !score) return null

    const scoreColor = score ? (
        score < 5 ? "bg-red-500" :
            score < 7 ? "bg-orange-500" :
                score < 9 ? "bg-green-500" :
                    "bg-brand-500 text-white bg-opacity-80"
    ) : ""

    return (
        <div className={"absolute z-10 right-1 bottom-1"}>
            <div className={cn(
                "backdrop-blur-lg inline-flex items-center justify-center gap-1 w-12 h-7 rounded-full font-bold bg-opacity-70 drop-shadow-sm shadow-lg",
                scoreColor,
            )}>
                <BiStar/> {(score === 0) ? "-" : score}
            </div>
        </div>
    )
}

const ProgressBadge = (props: { mediaId: number }) => {

    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(props.mediaId)
    const progress = !!collectionEntryAtom ? useSelectAtom(collectionEntryAtom, entry => entry?.progress) : undefined
    const episodes = !!collectionEntryAtom ? useSelectAtom(collectionEntryAtom, entry => entry?.media?.episodes) : undefined

    if (!collectionEntryAtom || !progress) return null

    return (
        <div className={"absolute z-10 left-1 bottom-1"}>
            <Badge size={"lg"}>
                {progress}/{episodes}
            </Badge>
        </div>
    )
}
