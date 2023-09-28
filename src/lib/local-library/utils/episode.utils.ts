import { LocalFile, LocalFileMetadata } from "@/lib/local-library/types"
import { Nullish } from "@/types/common"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"

/* -------------------------------------------------------------------------------------------------
 * Metadata
 * -----------------------------------------------------------------------------------------------*/

/**
 * @description
 * - Returns `true` if episode number exists even if it is 0
 * @param props
 */
export function localFile_episodeExists<T extends { metadata: LocalFileMetadata }>(props: T | null | undefined) {
    const metadata = props?.metadata
    return (!!metadata && metadata.episode !== undefined)
}

/**
 * @description
 * - Returns the episode number (0+)
 * @param props
 */
export function localFile_getEpisode<T extends { metadata: LocalFileMetadata }>(props: T | null | undefined) {
    const metadata = props?.metadata
    return localFile_episodeExists(props) ? metadata!.episode : undefined
}

/**
 * @description
 * - Returns the episode number if it's greater than 0
 * @param props
 */
// export function localFile_getValidEpisode<T extends { metadata: LocalFileMetadata }>(props: T | null | undefined) {
//     const metadata = props?.metadata
//     return localFile_isValidEpisode(props) ? metadata!.episode : undefined
// }


/**
 * @description
 * - Returns `true` if episode number is trackable (defined and greater than 0)
 * @param props
 */
// export function localFile_isValidEpisode<T extends { metadata: LocalFileMetadata }>(props: T | null | undefined) {
//     const episode = localFile_getEpisode(props)
//     return !!episode && episode > 0
// }

export function localFile_getAniDBEpisodeInteger<T extends {
    metadata: { aniDBEpisodeNumber?: string }
}>(props: T | null | undefined) {
    const metadata = props?.metadata
    if (!metadata || !metadata.aniDBEpisodeNumber) return undefined
    const parsed = Number(metadata.aniDBEpisodeNumber.replace(/\D/g, ""))
    return !isNaN(parsed) ? parsed : undefined
}

/**
 * @example
 * aniDBEpisodeNumber = "S1" //=> True
 * aniDBEpisodeNumber = "1" //=> False
 * aniDBEpisodeNumber = "" | undefined //=> False
 * @param props
 */
export function localFile_aniDBEpisodeIsSpecial<T extends {
    metadata: { aniDBEpisodeNumber?: string }
}>(props: T | null | undefined) {
    const metadata = props?.metadata
    if (!metadata || !metadata.aniDBEpisodeNumber) return false
    // Return numbers only, remove all letters
    return metadata.aniDBEpisodeNumber.toUpperCase().startsWith("S")
}

/**
 * @description
 * - Is not a special
 * - Is not an NC
 * - This includes files with 0 as an episode number
 * @param props
 */
export function localFile_isMain<T extends { metadata: LocalFileMetadata }>(props: T | null | undefined) {
    const metadata = props?.metadata
    return !!metadata && localFile_episodeExists(props) && !metadata.isSpecial && !metadata.isNC
}

/**
 * @description
 - Is not a special
 - Is not an NC
 * This excludes files with 0 as an episode number
 * @param props
 */
// export function localFile_isMainWithValidEpisode<T extends {
//     metadata: LocalFileMetadata
// }>(props: T | null | undefined) {
//     const metadata = props?.metadata
//     return !!metadata && localFile_isValidEpisode(props) && !metadata.isSpecial && !metadata.isNC
// }

/**
 * @description
 * - Returns `true` if `episode` and `aniDBEpisodeNumber` differ
 * @example
 * episode = 1; aniDBEpisodeNumber = "2" //=> True
 * episode = 1; aniDBEpisodeNumber = "1" //=> False
 * episode = 2; aniDBEpisodeNumber = "S2" //=> False
 * episode = 1; aniDBEpisodeNumber = "" | undefined //=> True
 * @param props
 */
export function localFile_episodeMappingDiffers<T extends {
    metadata: LocalFileMetadata
}>(props: T | null | undefined) {
    const metadata = props?.metadata
    const episode = localFile_getEpisode(props)
    return episode !== localFile_getAniDBEpisodeInteger(props)
}

/**
 * @description
 * - Returns `undefined` is file is not a main episode
 * - When mapping differs, use the main cover
 * @param props
 * @param mainCover // AniZip Cover
 * @param betterCover // Better source?
 * @param fallbackCover
 */
export function localFile_getEpisodeCover<T extends {
    metadata: LocalFileMetadata
}>(props: T | null | undefined, mainCover: Nullish<string>, betterCover?: Nullish<string>, fallbackCover?: Nullish<string>) {
    if (!localFile_isMain(props) || localFile_aniDBEpisodeIsSpecial(props)) return fallbackCover

    return localFile_episodeMappingDiffers(props) ? mainCover : betterCover || mainCover || fallbackCover
}

/**
 *
 * @param filename
 */
export function localFile_getCleanedFileTitle(filename: Nullish<string>) {
    return filename?.replace(/.(mkv|mp4)/, "")?.replace(/[^A-Z0-9 ]/ig, "") || ""
}

/**
 *
 * @param props
 * @param media
 */
export function localFile_getDisplayTitle<T extends Pick<LocalFile, "metadata" | "parsedInfo">>(props: T | null | undefined, media?: AnilistShowcaseMedia | null) {
    if (!props) return "???"

    const { metadata, parsedInfo } = props

    if (metadata.isSpecial)
        return `Special ${metadata.episode ?? localFile_getAniDBEpisodeInteger(props)}`
    else if (metadata.isNC)
        return parsedInfo?.title || localFile_getCleanedFileTitle(parsedInfo?.original)

    if (media?.format === "MOVIE")
        return media?.title?.userPreferred || media?.title?.romaji || media?.title?.english || parsedInfo?.title || "Movie"

    return `Episode ${metadata.episode}`
}


export function localFile_mediaIncludesSpecial<T extends Pick<LocalFile, "metadata">>(props: T | null | undefined, media?: AnilistShowcaseMedia | null) {
    if (!props || !media?.episodes || !props.metadata.aniDBMediaInfo?.episodeCount) return false
    return Number(props.metadata.aniDBMediaInfo.episodeCount - media.episodes) === -1
}
