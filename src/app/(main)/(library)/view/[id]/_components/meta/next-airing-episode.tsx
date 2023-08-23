import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { Tooltip } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { addSeconds, formatDistanceToNow } from "date-fns"
import React from "react"

export function NextAiringEpisode(props: { detailedMedia: AnilistDetailedMedia }) {
    return <>
        {!!props.detailedMedia.nextAiringEpisode && (
            <div className={"flex gap-2 items-center justify-center"}>
                <p className={"text-xl min-[2000px]:text-xl"}>Next episode:</p>
                <Tooltip
                    tooltipClassName={"bg-gray-200 text-gray-800 font-semibold mb-1"}
                    trigger={
                        <p className={"text-justify font-normal text-xl min-[2000px]:text-xl"}>
                            <Badge
                                size={"lg"}>{props.detailedMedia.nextAiringEpisode?.episode}</Badge>
                        </p>
                    }>{formatDistanceToNow(addSeconds(new Date(), props.detailedMedia.nextAiringEpisode?.timeUntilAiring), { addSuffix: true })}{}</Tooltip>
            </div>
        )}
    </>
}
