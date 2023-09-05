import React from "react"
import { WatchPage } from "@/app/(main)/watch/_containers/watch-page"
import { getAnimeInfo } from "@/lib/anilist/actions"

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
