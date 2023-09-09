import axios from "axios"
import { logger } from "@/lib/helpers/debug"
import { AnifyAnimeEpisodeData } from "@/lib/anify/types"

const ANIFY_API_KEY = process.env.ANIFY_API_KEY

export async function getAnifyEpisodes(mediaId: number) {

    try {
        const { data } = await axios.get<AnifyAnimeEpisodeData>(`https://api.anify.tv/episodes/21?apikey=${ANIFY_API_KEY}`)

        return data

    } catch (e) {
        logger("lib/anify/getAnifyEpisodeMeta").error("Could not get episodes")
        logger("lib/anify/getAnifyEpisodeMeta").error(e)
    }

}
