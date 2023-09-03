"use server"
import { ConsumetAnimeMeta, ConsumetErrorResponse, ConsumetStreamingData } from "@/lib/consumet/types"
import { logger } from "@/lib/helpers/debug"
import axios from "axios"

const CONSUMET_API_URL = process.env.CONSUMET_URL

export type ConsumetProvider =
    "9anime"
    | "animefox"
    | "animepahe"
    | "bilibili"
    | "crunchyroll"
    | "enime"
    | "gogoanime"
    | "marin"
    | "zoro"

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
 * @link https://docs.consumet.org/rest-api/Anime/gogoanime/get-anime-episode-streaming-links
 * @param episodeId ConsumetAnimeMeta["episodes"][number]["id"]
 * @param server
 */
export async function getConsumetZoroStreamingData(episodeId: string, server: "vidcloud" | "streamsb" | "vidstreaming" | "streamtape" = "vidcloud") {
    try {
        const { data } = await axios.get<ConsumetStreamingData | ConsumetErrorResponse>(`${CONSUMET_API_URL}/anime/zoro/watch/${episodeId}`, {
            method: "GET",
            params: {
                server: server,
            },
        })

        if (!(<ConsumetErrorResponse>data).message) {
            return data as ConsumetStreamingData
        } else {
            logger("lib/consumet/getConsumetMediaStreamingLinks").error("Not found")
            return undefined
        }
    } catch (e) {
        logger("lib/consumet/getConsumetMediaStreamingLinks").error("Could not fetch data")
        logger("lib/consumet/getConsumetMediaStreamingLinks").error(e)
        return undefined
    }
}


/**
 * @link https://docs.consumet.org/rest-api/Anime/gogoanime/get-anime-episode-streaming-links
 * @param episodeId ConsumetAnimeMeta["episodes"][number]["id"]
 * @param server
 */
export async function getConsumetGogoAnimeStreamingData(episodeId: string, server: "gogocdn" | "streamsb" | "vidstreaming" = "gogocdn") {
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
            logger("lib/consumet/getConsumetMediaStreamingLinks").error("Not found")
            return undefined
        }
    } catch (e) {
        logger("lib/consumet/getConsumetMediaStreamingLinks").error("Could not fetch data")
        logger("lib/consumet/getConsumetMediaStreamingLinks").error(e)
        return undefined
    }
}
