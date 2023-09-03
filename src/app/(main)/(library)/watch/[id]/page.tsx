import React from "react"
import { getAnimeInfo } from "@/app/(main)/(library)/view/[id]/get-anime-info"
import { WatchPage } from "@/app/(main)/(library)/watch/[id]/_components/watch-page"

export default async function Page({ params }: {
    params: { id: string }
}) {

    const { media, aniZipData } = await getAnimeInfo(params)

    return (
        <div>
            <div className={"relative z-10 max-w-full px-10 grid grid-cols-1 2xl:grid-cols-8 gap-8"}>
                <WatchPage
                    media={media}
                    aniZipData={aniZipData}
                />
            </div>
        </div>
    )
}
