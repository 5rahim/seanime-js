import axios from "axios"
import { logger } from "@/lib/helpers/debug"

/**
 * - Fetched AniZip data for a specific media
 * - Checks the cache and populates it
 * @param mediaId
 * @param _cache
 * @param from
 */
export async function fetchAniZipData(mediaId: number, _cache?: Map<number, AniZipData>, from: "anilist" | "mal" = "anilist") {
    if (_cache?.has(mediaId)) {
        return _cache.get(mediaId)
    }

    logger("lib/anizip/fetchAniZipData").info("Fetching AniZip data for", mediaId)
    const { data } = await axios.get<AniZipData>(`https://api.ani.zip/mappings?${from}_id=` + mediaId)

    if (data) {
        _cache?.set(mediaId, data)
    }
    return data
}
