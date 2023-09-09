"use server"
import axios from "axios"
import { logger } from "@/lib/helpers/debug"
import { AnifyAnimeEpisodeData, AnifyEpisodeCover } from "@/lib/anify/types"
import cache from "memory-cache"


const ANIFY_API_KEY = process.env.ANIFY_API_KEY

export async function getAnifyEpisodes(mediaId: number) {

    try {
        const { data } = await axios.get<AnifyAnimeEpisodeData>(`https://api.anify.tv/episodes/${mediaId}?apikey=${ANIFY_API_KEY}`)

        return data

    } catch (e) {
        logger("lib/anify/getAnifyEpisodeMeta").error("Could not get episodes")
        logger("lib/anify/getAnifyEpisodeMeta").error(e)
    }

}


export async function getAnifyEpisodeCovers(mediaId: number): Promise<AnifyEpisodeCover[] | undefined> {

    try {

        const key = `${mediaId}`
        const cached = cache.get(key)
        if (cached) {
            logger("lib/anify/getAnifyEpisodeMeta").info(`CACHE HIT`)
            return cached
        }
        logger("lib/anify/getAnifyEpisodeMeta").info("Fetching cover images for", mediaId)
        const { data } = await axios.get<AnifyEpisodeCover[]>(`https://api.anify.tv/episode-covers/${mediaId}?apikey=${ANIFY_API_KEY}`)

        cache.put(key, data, 1000 * 60 * 60) // 1 hour

        return data

    } catch (e) {
        logger("lib/anify/getAnifyEpisodeMeta").error("Could not get episode covers")
        // logger("lib/anify/getAnifyEpisodeMeta").error(e)
    }

}
