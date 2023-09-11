import React from "react"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { EpisodeSection } from "@/app/(main)/view/_containers/episode-section/episode-section"
import { MetaSection } from "@/app/(main)/view/_containers/meta-section/meta-section"

import { getAnimeInfo } from "@/lib/anilist/actions"
import { TorrentSearchModal } from "@/app/(main)/view/_containers/torrent-search/torrent-search-modal"


export default async function Page({ params }: { params: { id: string } }) {

    const { media, aniZipData } = await getAnimeInfo(params)

    return (
        <>
            <div>
                <div className={"__header h-[30rem] "}>
                    <div
                        className="h-[35rem] w-[calc(100%-5rem)] flex-none object-cover object-center absolute top-0 overflow-hidden">
                        <div
                            className={"w-full absolute z-[2] top-0 h-[15rem] bg-gradient-to-b from-[--background-color] to-transparent via"}
                        />
                        {(!!media.bannerImage || !!media.coverImage?.extraLarge) && <Image
                            src={media.bannerImage || media.coverImage?.extraLarge || ""}
                            alt={"banner image"}
                            fill
                            quality={100}
                            priority
                            sizes="100vw"
                            className="object-cover object-center z-[1]"
                        />}
                        {media.bannerImage && <Skeleton className={"z-0 h-full absolute w-full"}/>}
                        <div
                            className={"w-full z-[2] absolute bottom-0 h-[20rem] bg-gradient-to-t from-[--background-color] via-[--background-color] via-opacity-50 via-10% to-transparent"}
                        />

                    </div>
                </div>
                <div className={"-mt-[8rem] relative z-10 max-w-full px-10 grid grid-cols-1 2xl:grid-cols-2 gap-8 "}>
                    <div
                        className={"-mt-[18rem] h-[fit-content] 2xl:sticky top-[5rem]"}>
                        {/*<div className={"-mt-[18rem] p-8 rounded-xl backdrop-blur-2xl bg-gray-900 bg-opacity-50 backdrop-opacity-80 drop-shadow-md"}>*/}
                        <MetaSection detailedMedia={media}/>
                    </div>
                    <div className={"relative 2xl:order-first pb-10"}>
                        <EpisodeSection detailedMedia={media} aniZipData={aniZipData}/>
                    </div>
                </div>
            </div>
            <TorrentSearchModal
                media={media}
                aniZipData={aniZipData}
            />
        </>
    )
}
