/* -------------------------------------------------------------------------------------------------
 * Unused
 * -----------------------------------------------------------------------------------------------*/
import { LocalFileAniDBInfo } from "@/lib/local-library/types"
import { Nullish } from "@/types/common"

export type StoredAniDBData = {
    mediaId: number
    aniDBEpisodeCount: number
    aniDBSpecialCount: number
    mappings: AniZipData["mappings"]
}

/**
 * @description
 * - Returns formatted AniDB data from all matched media to be stored locally
 * @description Use
 * -
 */
export function anidb_getStorableDataFromCache(cache: Map<number, AniZipData>): StoredAniDBData[] {
    return [...cache.values()].map((data, key) => ({
        mediaId: key,
        aniDBEpisodeCount: data.episodeCount,
        aniDBSpecialCount: data.specialCount,
        mappings: data.mappings,
    }))
}

export function anidb_getFileAniDBMetadataFromCache(cache: Map<number, AniZipData>, mediaId: Nullish<number>): LocalFileAniDBInfo | undefined {
    const data = cache.get(mediaId || -1)

    if (!data) return undefined

    return {
        episodeCount: data.episodeCount,
        specialCount: data.specialCount,
    }
}
