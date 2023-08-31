import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { Badge } from "@/components/ui/badge"
import { addSeconds, formatDistanceToNow } from "date-fns"
import React from "react"

export function NextAiringEpisode(props: { detailedMedia: AnilistDetailedMedia }) {
    return <>
        {!!props.detailedMedia.nextAiringEpisode && (
            <div className={"flex gap-2 items-center justify-center"}>
                <p className={"text-xl min-[2000px]:text-xl"}>Next
                    episode {formatDistanceToNow(addSeconds(new Date(), props.detailedMedia.nextAiringEpisode?.timeUntilAiring), { addSuffix: true })}:</p>

                <p className={"text-justify font-normal text-xl min-[2000px]:text-xl"}>
                    <Badge
                        size={"lg"}>{props.detailedMedia.nextAiringEpisode?.episode}</Badge>
                </p>

            </div>
        )}
    </>
}
