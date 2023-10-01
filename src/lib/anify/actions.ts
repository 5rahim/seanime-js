"use server"
import axios from "axios"
import { logger } from "@/lib/helpers/debug"
import { AnifyEpisodeCover } from "@/lib/anify/types"
import cache from "memory-cache"

export async function getAnifyEpisodeCovers(mediaId: number): Promise<AnifyEpisodeCover[] | undefined> {

    try {

        const key = `${mediaId}`
        const cached = cache.get(key)
        if (cached) {
            logger("lib/anify/getAnifyEpisodeMeta").info("CACHE HIT")
            return cached
        } else {
            cache.del(key)
        }
        logger("lib/anify/getAnifyEpisodeMeta").info("Fetching cover images for", mediaId)
        const { data: res } = await axios.get<{ providerId: string, data: AnifyEpisodeCover[] }[]>(`https://api.anify.tv/content-metadata?id=${mediaId}`)

        const data = res.find(n => n.providerId === "tvdb")?.data

        if (data) {
            cache.put(key, data, 1000 * 60 * 60) // 1 hour
        }

        return data

    } catch (e) {
        logger("lib/anify/getAnifyEpisodeMeta").error("Could not get episode covers")
        logger("lib/anify/getAnifyEpisodeMeta").error(e)
    }

}
