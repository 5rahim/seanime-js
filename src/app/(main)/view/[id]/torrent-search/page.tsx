import React from "react"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { IconButton } from "@/components/ui/button"
import { AiOutlineArrowLeft } from "@react-icons/all-files/ai/AiOutlineArrowLeft"
import Link from "next/link"
import { getAnimeInfo } from "@/lib/anilist/actions"
import { TorrentSearchModal } from "@/app/(main)/view/_containers/torrent-search/torrent-search-modal"

export default async function Page({ params }: { params: { id: string } }) {

    const { media, aniZipData } = await getAnimeInfo(params)

    return (
        <div>
            <div className={"__header h-[15rem] "}>
                <div
                    className="h-[15rem] w-[calc(100%-5rem)] flex-none object-cover object-center absolute top-0 overflow-hidden">
                    <div
                        className={"w-full absolute z-[2] top-0 h-[15rem] bg-gradient-to-b from-[--background-color] to-transparent via"}/>
                    {media.bannerImage && <Image
                        src={media.bannerImage || ""}
                        alt={""}
                        fill
                        quality={80}
                        priority
                        sizes="100vw"
                        className="object-cover object-center z-[1]"
                    />}
                    {media.bannerImage && <Skeleton className={"z-0 h-full absolute w-full"}/>}
                    <div
                        className={"w-full z-[2] absolute bottom-0 h-[20rem] bg-gradient-to-t from-[--background-color] via-[--background-color] via-opacity-50 via-10% to-transparent"}/>

                    {/*<div className={"z-[3] bottom-4 left-4 absolute"}>*/}
                    {/*    <h1>{media.title?.english}</h1>*/}
                    {/*</div>*/}
                </div>
            </div>
            <div className={"-mt-[12rem] relative z-10 max-w-full px-10"}>
                <div className={"flex gap-8 items-center"}>
                    <Link href={`/view/${media.id}`}>
                        <IconButton icon={<AiOutlineArrowLeft/>} rounded intent={"white-outline"} size={"lg"}/>
                    </Link>
                    <h2>{media.title?.english}</h2>
                </div>
                <div className={"mt-8"}>
                    <TorrentSearchModal
                        mediaId={media.id}
                    />
                </div>
            </div>
        </div>
    )
}
