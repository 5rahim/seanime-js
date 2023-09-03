import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { EpisodeListSkeleton } from "@/app/(main)/(library)/watch/[id]/_components/watch-page"

export default function loading() {
    return (
        <div className={"relative z-10 max-w-full px-10 grid grid-cols-1 2xl:grid-cols-8 gap-8"}>
            <Skeleton className={"col-span-8 w-full h-10"}/>
            <div className={"relative col-span-5 w-full h-full"}>
                <Skeleton className={"aspect-video h-auto w-full"}/>
            </div>
            <div className={"relative col-span-3 p-4 pt-0 space-y-4"}>
                <EpisodeListSkeleton/>
            </div>
        </div>
    )
}
