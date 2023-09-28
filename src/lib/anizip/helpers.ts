import axios from "axios"

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

    const { data } = await axios.get<AniZipData>(`https://api.ani.zip/mappings?${from}_id=` + mediaId)

    if (data) {
        _cache?.set(mediaId, data)
    }
    return data
}
