"use client"

import { useQuery } from "@tanstack/react-query"
import { SkipTime } from "@/lib/aniskip/types"
import { ConsumetAnimeEpisodeMeta, ConsumetProvider } from "@/lib/consumet/types"
import { getConsumetEpisodeMeta, getConsumetEpisodeStreamingData } from "@/lib/consumet/actions"

/**
 * Get an episode streaming data from a specific provider
 * @param episodes
 * @param episodeNumber
 * @param provider
 * @param server
 */
export function useEpisodeStreamingData(episodes: ConsumetAnimeEpisodeMeta[], episodeNumber: number, provider: ConsumetProvider, server: any | undefined) {
    const episodeId = episodes.find(episode => episode.number === episodeNumber)?.id
    const res = useQuery(
        ["episode-streaming-data", episodes, episodeNumber, server || "-"],
        async () => {
            return await getConsumetEpisodeStreamingData(episodeId!, provider, server, false)
        },
        { enabled: !!episodeId, retry: false, keepPreviousData: false, refetchOnWindowFocus: false },
    )
    return { data: res.data, isLoading: res.isLoading || res.isFetching, isError: res.isError }
}

/**
 * Get metadata of all episodes from all providers
 * @param mediaId
 * @param server
 */
export function useProviderEpisodes(mediaId: number, server: any) {
    const res = useQuery(
        ["episode-data", mediaId, server],
        async () => {
            return await getConsumetEpisodeMeta(mediaId, server, false)
        },
        { keepPreviousData: false, refetchOnWindowFocus: false },
    )
    return { data: res.data, isLoading: res.isLoading || res.isFetching, isError: res.isError }
}

/**
 * Get skip information for a certain media
 * @param mediaMalId
 * @param episodeNumber
 */
export function useSkipData(mediaMalId: number | null | undefined, episodeNumber: number) {
    const res = useQuery(
        ["skip-data", mediaMalId, episodeNumber],
        async () => {
            const result = await fetch(
                `https://api.aniskip.com/v2/skip-times/${mediaMalId}/${episodeNumber}?types[]=ed&types[]=mixed-ed&types[]=mixed-op&types[]=op&types[]=recap&episodeLength=`,
            )
            const skip = (await result.json()) as { found: boolean, results: SkipTime[] }
            if (!!skip.results && skip.found) return {
                op: skip.results?.find((item) => item.skipType === "op") || null,
                ed: skip.results?.find((item) => item.skipType === "ed") || null,
            }
            return { op: null, ed: null }
        },
        { keepPreviousData: false, refetchOnWindowFocus: false, enabled: !!mediaMalId },
    )
    return { data: res.data, isLoading: res.isLoading || res.isFetching, isError: res.isError }
}
