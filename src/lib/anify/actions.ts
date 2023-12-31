"use server"
import axios from "axios"
import { logger } from "@/lib/helpers/debug"
import { AnifyAnimeEpisode } from "@/lib/anify/types"

export async function getAnifyAnimeMetadata(mediaId: number): Promise<AnifyAnimeEpisode[] | undefined> {

    try {
        const key = `${mediaId}`
        logger("lib/anify/getAnifyAnimeMetadata").info("Fetching metadata for", mediaId)
        const { data: res } = await axios.get<{
            providerId: string,
            data: AnifyAnimeEpisode[]
        }[]>(`https://api.anify.tv/content-metadata?id=${mediaId}`)

        // Get metadata from TVDB
        return res.find(n => n.providerId === "tvdb")?.data

    } catch (e) {
        logger("lib/anify/getAnifyAnimeMetadata").error("Could not get episode covers")
        logger("lib/anify/getAnifyAnimeMetadata").error(e)
    }

}
