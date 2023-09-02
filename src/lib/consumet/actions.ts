"use server"
import { ConsumetAnimeMeta, ConsumetErrorResponse, ConsumetStreamingData } from "@/lib/consumet/types"
import { logger } from "@/lib/helpers/debug"

const API_URL = process.env.CONSUMET_URL

/**
 * @link https://docs.consumet.org/rest-api/Meta/anilist-anime/get-anime-info
 * @param mediaId
 */
export async function getConsumetMediaEpisodes(mediaId: number = 1) {
    try {
        const res = await fetch(`${API_URL}/meta/anilist/info/${mediaId}`, {
            method: "GET",
        })
        const data = (await res.json()) as ConsumetAnimeMeta | ConsumetErrorResponse
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
export async function getConsumetGogoAnimeStreamingData(episodeId: string, server: "gogocdn" | "streamsb" | "vidstreaming" = "gogocdn") {
    try {
        const res = await fetch(`${API_URL}/anime/gogoanime/watch/${episodeId}?server=${server}`)
        const data = (await res.json()) as ConsumetStreamingData | ConsumetErrorResponse
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
