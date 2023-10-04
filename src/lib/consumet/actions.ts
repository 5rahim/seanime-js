"use server"
import {
    ConsumetAnimeEpisode,
    ConsumetAnimeMeta,
    ConsumetErrorResponse,
    ConsumetProvider,
    ConsumetStreamingProviderData,
    GogoAnimeServer,
    ZoroServer,
} from "@/lib/consumet/types"
import { logger } from "@/lib/helpers/debug"
import axios from "axios"
import cache from "memory-cache"
import sortBy from "lodash/sortBy"

const CONSUMET_API_URL = process.env.CONSUMET_API_URL

/**
 * Get metadata of all episodes from all providers
 * @param mediaId
 * @param server
 * @param skipCache
 */
export async function getConsumetEpisodes<P extends ConsumetProvider>(
    mediaId: number,
    server?: P extends "gogoanime" ? GogoAnimeServer : ZoroServer,
    skipCache?: boolean,
): Promise<{ provider: ConsumetProvider, episodes: ConsumetAnimeEpisode[] }[]> {

    const data: { provider: ConsumetProvider, episodes: ConsumetAnimeEpisode[] }[] = []

    logger("lib/consumet/getConsumetEpisodeMeta").info(`Fetching all episodes from all providers`, mediaId, server)

    const key = `${mediaId}`
    if (!skipCache) {
        const cached = cache.get(key)
        if (cached) {
            logger("lib/consumet/getConsumetEpisodeMeta").info(`CACHE HIT`)
            return cached
        }
    } else {
        cache.del(key)
    }

    async function fetchData(provider: ConsumetProvider) {

        const _temp_data: { provider: ConsumetProvider, episodes: ConsumetAnimeEpisode[] }[] = []

        const [consumetResult] = await Promise.allSettled([
            axios.get<ConsumetAnimeMeta>(`${CONSUMET_API_URL}/meta/anilist/info/${mediaId}?provider=${provider}`),
            // ...
        ])

        if (consumetResult.status === "fulfilled") {
            const { data } = consumetResult.value
            if (!!data && data.episodes.length > 0) {
                _temp_data.push({
                    provider: provider,
                    episodes: sortBy(data.episodes, n => n.number),
                })
            }
        } else {
            if (!CONSUMET_API_URL)
                throw new Error("Consumet API URL is missing")
            else
                throw new Error("Could not retrieve data from your Consumet API")
        }

        data.push(..._temp_data)

    }

    await Promise.allSettled((["gogoanime", "zoro"] as ConsumetProvider[]).map((provider) => fetchData(provider)))

    if (data.length > 0) {
        cache.put(key, data, 1000 * 60 * 60 * 10)
    }

    return data
}

/**
 * Get an episode streaming data from a specific provider
 * @param episodeId
 * @param provider
 * @param server
 * @param skipCache
 */
export async function getConsumetEpisodeStreamingData<P extends ConsumetProvider>(
    episodeId: string,
    provider: P,
    server?: P extends "gogoanime" ? GogoAnimeServer : ZoroServer,
    skipCache?: boolean,
): Promise<ConsumetStreamingProviderData | undefined> {
    const key = `${episodeId}/${provider}/${server || "-"}`
    logger("lib/consumet/getConsumetEpisodeStreamingData").info(`Fetching episode streaming data`, provider, key)
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
            logger("lib/consumet/getConsumetEpisodeStreamingData").info(episodeId, provider)
            cache.put(key, data)
            return data
        } else {
            throw new Error("Could not find episode on GogoAnime")
        }
    } else if (provider === "zoro") {
        const data = await getConsumetZoroEpisodeStreamingData(episodeId, server as any)
        if (data) {
            logger("lib/consumet/getConsumetEpisodeStreamingData").info(episodeId, provider)
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
        const { data } = await axios.get<ConsumetStreamingProviderData | ConsumetErrorResponse>(`${CONSUMET_API_URL}/anime/zoro/watch`, {
            method: "GET",
            params: {
                episodeId: episodeId,
                server: server,
            },
        })

        if (!(<ConsumetErrorResponse>data).message) {
            return data as ConsumetStreamingProviderData
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
        const { data } = await axios.get<ConsumetStreamingProviderData | ConsumetErrorResponse>(`${CONSUMET_API_URL}/anime/gogoanime/watch/${episodeId}`, {
            method: "GET",
            params: {
                server: server,
            },
        })
        if (!(<ConsumetErrorResponse>data).message) {
            return data as ConsumetStreamingProviderData
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
