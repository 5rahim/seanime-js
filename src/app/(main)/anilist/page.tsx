"use client"

import React from "react"
import { useSettings } from "@/atoms/settings"
import { useAnilistCollection } from "@/lib/anilist/collection"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AnimeList } from "@/components/application/list/anime-list"

export default function Home() {

    const { settings } = useSettings()

    const { currentlyWatchingList, collection, isLoading } = useAnilistCollection()

    if (isLoading) return <LoadingSpinner/>

    return (
        <main className={"px-4"}>
            <AnimeList
                items={[
                    ...currentlyWatchingList.map(entry => ({
                        title: entry?.media?.title?.userPreferred || "",
                        imageSrc: entry?.media?.coverImage?.large || "",
                        isAiring: entry?.media?.status === "RELEASING",
                    })),
                ]}
            />
            {/*<pre>*/}
            {/*    {JSON.stringify(currentlyWatchingList, null, 2)}*/}
            {/*</pre>*/}
        </main>
    )
}
