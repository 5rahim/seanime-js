import React from "react"
import { getAnimeInfo } from "@/app/(main)/(library)/view/[id]/get-anime-info"
import { WatchPage } from "@/app/(main)/(library)/watch/[id]/[provider]/[episodeNumber]/_components/watch-page"
import { ConsumetProvider, getConsumetMediaEpisodes } from "@/lib/consumet/actions"
import { redirect } from "next/navigation"


export default async function Page({ params }: {
    params: { id: string, provider: ConsumetProvider, episodeNumber: number }
}) {

    const { media, aniZipData } = await getAnimeInfo(params)
    const episodes = await getConsumetMediaEpisodes(media.id, params.provider)

    if (!episodes) redirect("/")

    return (
        <div>
            <div className={"relative z-10 max-w-full px-10 grid grid-cols-1 2xl:grid-cols-8 gap-8 "}>
                <WatchPage
                    media={media}
                    aniZipData={aniZipData}
                    episodeNumber={Number(params.episodeNumber)}
                    episodes={episodes!}
                />
            </div>
        </div>
    )
}
