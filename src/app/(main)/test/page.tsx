"use client"

import React, { useEffect } from "react"
import { useAniListClientQuery } from "@/hooks/graphql-client-helpers"
import { AnimeShortMediaByIdDocument } from "@/gql/graphql"
import { findMediaEdge } from "@/lib/anilist/utils"

import { resolveSeason } from "@/lib/anilist/actions"

export default function Page() {

    // Bungo 1: 21311
    // Bungo 5: 163263
    // JJK: 113415
    // JJK S2: 145064
    // Mushoku 108465
    // Mushoku Cour 2 127720
    const { data } = useAniListClientQuery(AnimeShortMediaByIdDocument, { id: 113415 })

    useEffect(() => {
        (async () => {
            const parseObj = {
                anime_season: undefined,
                episode_number: 29,
            }
            if (data?.Media) {
                const highestEp = data.Media.nextAiringEpisode?.episode || data.Media.episodes

                const episode = parseObj.episode_number

                // The parser got an absolute episode number, we will normalize it and give the file the correct ID
                if (highestEp && episode && episode > highestEp) {
                    const prequel = !parseObj.anime_season ? (
                        findMediaEdge(data.Media, "PREQUEL")?.node
                        || ((data.Media.format === "OVA" || data.Media.format === "ONA")
                            ? findMediaEdge(data.Media, "PARENT")?.node
                            : undefined)
                    ) : undefined

                    // value bigger than episode count
                    const result = await resolveSeason({
                        media: prequel || data.Media,
                        episode: parseObj.episode_number,
                        increment: !parseObj.anime_season ? null : true, // Increment if season there is a season
                        // force: true
                    })
                    console.log(result)
                } else {
                    console.log(parseObj.episode_number)
                }
            }
        })()
        // (async () => {
        //     if(data?.Media) {
        //         console.log(getAnilistMediaTitleList(data.Media))
        //     }
        // })()
    }, [data])

    return (
        <div className={"px-4"}>
            <pre>{JSON.stringify(data?.Media, null, 2)}</pre>
            <pre>{}</pre>
        </div>
    )
}
