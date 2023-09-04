"use server"
import {
    ConsumetAnimeEpisodeMeta,
    ConsumetAnimeMeta,
    ConsumetErrorResponse,
    ConsumetProvider,
    ConsumetStreamingData,
    GogoAnimeServer,
    ZoroServer,
} from "@/lib/consumet/types"
import { logger } from "@/lib/helpers/debug"
import axios from "axios"
import cache from "memory-cache"
import _ from "lodash"

const CONSUMET_API_URL = process.env.CONSUMET_URL

/**
 * @link https://docs.consumet.org/rest-api/Meta/anilist-anime/get-anime-info
 * @param mediaId
 * @param provider
 */
export async function getConsumetMediaEpisodes(mediaId: number = 1, provider: ConsumetProvider = "gogoanime") {
    try {

        const { data } = await axios.get<ConsumetAnimeMeta | ConsumetErrorResponse>(`${CONSUMET_API_URL}/meta/anilist/info/${mediaId}`, {
            method: "GET",
            params: {
                provider: provider,
            },
        })

        if (!(<ConsumetErrorResponse>data).message) {
            return (<ConsumetAnimeMeta>data)?.episodes?.reverse()
        } else {
            logger("lib/consumet/getConsumetMediaEpisodes").error("Media not found")
            return undefined
        }
    } catch (e) {
        logger("lib/consumet/getConsumetMediaEpisodes").error("Could not fetch data")
        logger("lib/consumet/getConsumetMediaEpisodes").error(e)
        return undefined
    }
}

/**
 * Get metadata of all episodes from all providers
 * @param mediaId
 * @param server
 * @param skipCache
 */
export async function getConsumetEpisodeMeta<P extends ConsumetProvider>(
    mediaId: number,
    server?: P extends "gogoanime" ? GogoAnimeServer : ZoroServer,
    skipCache?: boolean,
): Promise<{ provider: ConsumetProvider, episodes: ConsumetAnimeEpisodeMeta[] }[]> {

    const data: { provider: ConsumetProvider, episodes: ConsumetAnimeEpisodeMeta[] }[] = []

    const key = `${mediaId}`
    if (!skipCache) {
        const cached = cache.get(key)
        if (cached) {
            console.log("cache hit", data)
            return cached
        }
    } else {
        cache.del(key)
    }

    async function fetchData(provider: ConsumetProvider) {
        try {
            const resData = await fetch(
                `${CONSUMET_API_URL}/meta/anilist/info/${mediaId}?provider=${provider}`,
            ).then((res) => {
                if (!res.ok) {
                    switch (res.status) {
                        case 404: {
                            return null
                        }
                    }
                }
                return res.json() as Promise<ConsumetAnimeMeta>
            })
            if (!!resData && resData.episodes.length > 0) {
                data.push({
                    provider: provider,
                    episodes: _.sortBy(resData.episodes, n => n.number),
                })
            }
        } catch (error) {
            console.error(
                `Error fetching data for provider '${provider}':`,
                error,
            )
        }
    }

    await Promise.all((["gogoanime", "zoro"] as ConsumetProvider[]).map((provider) => fetchData(provider)))

    if (data.length > 0) {
        cache.put(key, data, 1000 * 60 * 60 * 10)
    }
    return data
}

export async function getConsumetEpisodeStreamingData<P extends ConsumetProvider>(
    episodeId: string,
    provider: P,
    server?: P extends "gogoanime" ? GogoAnimeServer : ZoroServer,
    skipCache?: boolean,
): Promise<ConsumetStreamingData | undefined> {
    const key = `${episodeId}/${provider}/${server || "-"}`
    logger("lib/consumet/getConsumetEpisodeStreamingData").info(`Fetching episode streaming data from ${provider}`, "Key:", key)
    if (!skipCache) {
        const cached = cache.get(key)
        if (cached) {
            logger("lib/consumet/getConsumetEpisodeStreamingData").info("Cache HIT, returning cached data")
            return cached
        }
    } else {
        cache.del(key)
    }
    if (provider === "gogoanime") {
        const data = await getConsumetGogoAnimeEpisodeStreamingData(episodeId, server as any)
        if (data) {
            logger("lib/consumet/getConsumetEpisodeStreamingData").info(episodeId, `Returning data for`, provider)
            cache.put(key, data)
            return data
        } else {
            throw new Error("Could not find episode on GogoAnime")
        }
    } else if (provider === "zoro") {
        const data = await getConsumetZoroEpisodeStreamingData(episodeId, server as any)
        if (data) {
            logger("lib/consumet/getConsumetEpisodeStreamingData").info(episodeId, `Returning data for`, provider)
            cache.put(key, data)
            return data
        } else {
            throw new Error("Could not find episode on Zoro")
        }
    }
}

/**
 * @link https://docs.consumet.org/rest-api/Anime/gogoanime/get-anime-episode-streaming-links
 * @param episodeId ConsumetAnimeMeta["episodes"][number]["id"]
 * @param server
 */
export async function getConsumetZoroEpisodeStreamingData(episodeId: string, server: ZoroServer = "vidstreaming") {
    try {
        const { data } = await axios.get<ConsumetStreamingData | ConsumetErrorResponse>(`${CONSUMET_API_URL}/anime/zoro/watch`, {
            method: "GET",
            params: {
                episodeId: episodeId,
                server: server,
            },
        })

        if (!(<ConsumetErrorResponse>data).message) {
            return data as ConsumetStreamingData
        } else {
            logger("lib/consumet/getConsumetZoroEpisodeStreamingData").error("Not found")
            return undefined
        }
    } catch (e: any) {
        logger("lib/consumet/getConsumetZoroEpisodeStreamingData").error("Could not fetch data", `${CONSUMET_API_URL}/anime/zoro/watch?episodeId=${episodeId}?server=${server}`)
        logger("lib/consumet/getConsumetZoroEpisodeStreamingData").error(e.code)
        return undefined
    }
}


/**
 * @link https://docs.consumet.org/rest-api/Anime/gogoanime/get-anime-episode-streaming-links
 * @param episodeId ConsumetAnimeMeta["episodes"][number]["id"]
 * @param server
 */
export async function getConsumetGogoAnimeEpisodeStreamingData(episodeId: string, server: GogoAnimeServer = "gogocdn") {
    try {
        const { data } = await axios.get<ConsumetStreamingData | ConsumetErrorResponse>(`${CONSUMET_API_URL}/anime/gogoanime/watch/${episodeId}`, {
            method: "GET",
            params: {
                server: server,
            },
        })
        if (!(<ConsumetErrorResponse>data).message) {
            return data as ConsumetStreamingData
        } else {
            logger("lib/consumet/getConsumetGogoAnimeEpisodeStreamingData").error("Not found")
            return undefined
        }
    } catch (e: any) {
        logger("lib/consumet/getConsumetGogoAnimeEpisodeStreamingData").error("Could not fetch data", `${CONSUMET_API_URL}/anime/gogoanime/watch/${episodeId}?server=${server}`)
        logger("lib/consumet/getConsumetGogoAnimeEpisodeStreamingData").error(e.code)
        return undefined
    }
}
