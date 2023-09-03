"use client"

import React from "react"
import { useAniListClientQuery } from "@/hooks/graphql-client-helpers"
import { AnimeShortMediaByIdDocument } from "@/gql/graphql"
import { useAsync } from "react-use"
import { useSettings } from "@/atoms/settings"
import { useAuthed } from "@/atoms/auth"

export default function Page() {

    const { settings } = useSettings()

    const { token } = useAuthed()
    // Bungo 1: 21311
    // Bungo 5: 163263
    // JJK: 113415
    // JJK S2: 145064
    // Mushoku 108465
    // Mushoku Cour 2 127720
    const { data } = useAniListClientQuery(AnimeShortMediaByIdDocument, { id: 21311 })

    // const state = useAsync(async () => {
    //     const traversedIds = new Set<number>()
    //     if(data?.Media) {
    //         const parseObj = {
    //             anime_season: undefined,
    //             episode_number: 29,
    //         }
    //         const prequel = !parseObj.anime_season ? (
    //             findMediaEdge(data.Media, "PREQUEL")?.node
    //             || ((data.Media.format === "OVA" || data.Media.format === "ONA")
    //                 ? findMediaEdge(data.Media, "PARENT")?.node
    //                 : undefined)
    //         ) : undefined
    //         return prequel
    //     }
    //     return undefined
    // }, [data])

    // Test [searchWithAnilist]
    // const state = useAsync(async () => {
    //     return rakun.parse("Demon Slayer S04E08 1080p WEB x264 E-AC-3 -Tsundere-Raws (Kimetsu no Yaiba: Katanakaji no Sato-hen)")
    //     return await resolveTitle("Demon Slayer - (Kimetsu no Yaiba - Katanakaji no Sato Hen)")
    //
    //     return await searchWithAnilist({ name: "mononogatari", method: "SearchName",
    //         perPage: 10,
    //         status: ["RELEASING", "FINISHED", "CANCELLED"],
    //         sort: "SEARCH_MATCH" })
    // }, [settings])

    // Test [searchWithAnilist]
    // const state = useAsync(async () => {
    //     // const res = await getAllFileNames(settings.library.localDirectory!)
    //     // console.log(res)
    //     // return res
    //     // return await searchWithAnilist({ name: "evangelion", method: "SearchName",
    //     //     perPage: 10,
    //     //     status: ["RELEASING", "FINISHED", "CANCELLED"],
    //     //     sort: "SEARCH_MATCH" })
    //     const _t = rakun.parse("[SubsPlease] one piece movie - film z (1080p) [Batch]").name
    //     let _title = _t
    //
    //     return await advancedSearchWithMAL(_title)
    // }, [settings])

    // const [state, setState] = useState<any>()
    //
    // useUpdateEffect(() => {
    //     (async () => {
    //         try {
    //             if (data?.Media && token) {
    //                 const queryMap = new Map<number, AnilistShortMedia>
    //                 const res = await fetchRelatedMedia(data.Media, queryMap, token)
    //                 queryMap.clear()
    //                 console.log(res)
    //                 setState(res)
    //             }
    //         } catch (e) {
    //             console.log(e)
    //         }
    //     })()
    // }, [data, token])

    const state = useAsync(async () => {
        return null
    })


    return (
        <div className={"px-4"}>
            {/*<div className={"h-[45rem]"}>*/}
            {/*    {!!state.value && <VideoStreamer*/}
            {/*        id={"cowboy-bebop-episode-1"}*/}
            {/*        data={state.value}*/}
            {/*        session={null}*/}
            {/*        aniId={"cowboy-bebop-episode-1"}*/}
            {/*        skip={undefined}*/}

            {/*    />}*/}
            {/*</div>*/}
            <pre>{JSON.stringify(state.value, null, 2)}</pre>

        </div>
    )
    // useEffect(() => {
    //     (async () => {
    //         const parseObj = {
    //             anime_season: undefined,
    //             episode_number: 29,
    //         }
    //         if (data?.Media) {
    //             const highestEp = data.Media.nextAiringEpisode?.episode || data.Media.episodes
    //
    //             const episode = parseObj.episode_number
    //
    //             // The parser got an absolute episode number, we will normalize it and give the file the correct ID
    //             if (highestEp && episode && episode > highestEp) {
    //                 const prequel = !parseObj.anime_season ? (
    //                     findMediaEdge(data.Media, "PREQUEL")?.node
    //                     || ((data.Media.format === "OVA" || data.Media.format === "ONA")
    //                         ? findMediaEdge(data.Media, "PARENT")?.node
    //                         : undefined)
    //                 ) : undefined
    //
    //                 // value bigger than episode count
    //                 const result = await resolveSeason({
    //                     media: prequel || data.Media,
    //                     episode: parseObj.episode_number,
    //                     increment: !parseObj.anime_season ? null : true, // Increment if season there is a season
    //                     // force: true
    //                 })
    //                 console.log(result)
    //             } else {
    //                 console.log(parseObj.episode_number)
    //             }
    //         }
    //     })()
    // }, [data])
}
