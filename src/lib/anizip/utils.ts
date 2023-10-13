import { LocalFileMetadata } from "@/lib/local-library/types"
import { AniZipData } from "@/lib/anizip/types"

export function anizip_getEpisode(data: AniZipData | null | undefined, episode: number | string) {
    return data?.episodes?.[String(episode)]
}

/**
 * @description
 * - Returns AnizipData.Episode based a file's aniDBEpisodeNumber metadata
 * - Uses metadata.episode as fallback
 * @param data
 * @param props
 */
export function anizip_getEpisodeFromMetadata<T extends {
    metadata: LocalFileMetadata | null | undefined
}>(data: AniZipData | null | undefined, props: T | null | undefined) {
    const metadata = props?.metadata
    if (!metadata)
        return undefined
    // Use metadata.episode if aniDBEpisodeNumber is undefined or empty
    return data?.episodes?.[metadata.aniDBEpisodeNumber || String(metadata.episode)]
}
