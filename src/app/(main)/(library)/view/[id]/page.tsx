import React from "react"
import { redirect } from "next/navigation"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeByIdDocument } from "@/gql/graphql"
import { logger } from "@/lib/helpers/debug"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { EpisodeSection } from "@/app/(main)/(library)/view/[id]/_components/episode-section"
import { MetaSection } from "@/app/(main)/(library)/view/[id]/_components/meta-section"

export default async function Page({ params }: { params: { id: string } }) {

    if (!params.id || isNaN(Number(params.id))) redirect("/")

    const mediaQuery = await useAniListAsyncQuery(AnimeByIdDocument, { id: Number(params.id) })

    if (!mediaQuery.Media) redirect("/")

    const aniQuery = await fetch("https://api.ani.zip/mappings?anilist_id=" + Number(params.id))
    const aniZipData = await aniQuery.json() as AniZipData

    logger("view/id").info("Fetched media data for " + mediaQuery.Media.title?.english)

    const media = mediaQuery.Media

    return (
        <div>
            <div className={"__header h-[30rem] "}>
                <div
                    className="h-[35rem] w-[calc(100%-5rem)] flex-none object-cover object-center absolute top-0 overflow-hidden">
                    <div
                        className={"w-full absolute z-[2] top-0 h-[15rem] bg-gradient-to-b from-[--background-color] to-transparent via"}/>
                    <Image
                        src={media.bannerImage || ""}
                        alt={""}
                        fill
                        quality={80}
                        priority
                        sizes="100vw"
                        className="object-cover object-center z-[1]"
                    />
                    <Skeleton className={"z-0 h-full absolute w-full"}/>
                    <div
                        className={"w-full z-[2] absolute bottom-0 h-[20rem] bg-gradient-to-t from-[--background-color] via-[--background-color] via-opacity-50 via-10% to-transparent"}/>

                    {/*<div className={"z-[3] bottom-4 left-4 absolute"}>*/}
                    {/*    <h1>{media.title?.english}</h1>*/}
                    {/*</div>*/}
                </div>
            </div>
            <div className={"-mt-[8rem] relative z-10 max-w-full px-10 grid grid-cols-1 md:grid-cols-2 gap-8"}>
                <div>
                    <EpisodeSection detailedMedia={media} aniZipData={aniZipData}/>
                </div>
                <div
                    className={"-mt-[18rem] h-[fit-content] p-8 rounded-xl bg-gray-900 bg-opacity-80 drop-shadow-md sticky top-[5rem]"}>
                    {/*<div className={"-mt-[18rem] p-8 rounded-xl backdrop-blur-2xl bg-gray-900 bg-opacity-50 backdrop-opacity-80 drop-shadow-md"}>*/}
                    <MetaSection detailedMedia={media}/>
                </div>
            </div>
        </div>
    )
}
