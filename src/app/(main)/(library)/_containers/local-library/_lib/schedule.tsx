/* -------------------------------------------------------------------------------------------------
 * Basically, this entire file is just notify the user about missing episodes
 * -----------------------------------------------------------------------------------------------*/

import { Atom } from "jotai"
import { LibraryEntry } from "@/atoms/library/library-entry.atoms"
import React, { useEffect } from "react"
import { useSelectAtom } from "@/atoms/helpers"
import { useSetAtom } from "jotai/react"
import { useMediaDownloadInfo } from "@/lib/download/helpers"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { __episodesUptToDateAtom } from "@/app/(main)/schedule/_containers/missed-episodes/missed-episodes"

type Props = {
    entryAtoms: Atom<LibraryEntry>[]
}

export function FetchMediaSchedule(props: Props) {
    return (
        <>
            {props.entryAtoms.map(entryAtom => {
                return <Item key={`${entryAtom}`} entryAtom={entryAtom}/>
            })}
        </>
    )
}

type ItemProps = {
    entryAtom: Atom<LibraryEntry>
}

function Item(props: ItemProps) {

    const media = useSelectAtom(props.entryAtom, entry => entry.media)
    const setEpisodesUpToDate = useSetAtom(__episodesUptToDateAtom)

    const {
        downloadInfo,
    } = useMediaDownloadInfo(media)

    const { isLoading, isFetching } = useQuery({
        queryKey: ["missed-episode-data", media.id, downloadInfo.episodeNumbers],
        queryFn: async () => {
            const { data } = await axios.get<AniZipData>("https://api.ani.zip/mappings?anilist_id=" + Number(media.id))
            return data
        },
        keepPreviousData: false,
        enabled: downloadInfo.episodeNumbers.length > 0,
        cacheTime: 1000 * 60 * 60,
    })

    useEffect(() => {
        if (!isLoading && !isFetching && downloadInfo.episodeNumbers.length > 0) setEpisodesUpToDate(false)
    }, [isLoading, isFetching])

    return null
}
