import { LocalFileMetadata } from "@/lib/local-library/types"

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
export function localFile_getValidEpisode<T extends { metadata: LocalFileMetadata }>(props: T | null | undefined) {
    const metadata = props?.metadata
    return localFile_isValidEpisode(props) ? metadata!.episode : undefined
}


/**
 * @description
 * - Returns `true` if episode number is trackable (defined and greater than 0)
 * @param props
 */
export function localFile_isValidEpisode<T extends { metadata: LocalFileMetadata }>(props: T | null | undefined) {
    const episode = localFile_getEpisode(props)
    return !!episode && episode > 0
}

export function localFile_getAniDBEpisodeInteger<T extends {
    metadata: { aniDBEpisodeNumber?: string }
}>(props: T | null | undefined) {
    const metadata = props?.metadata
    if (!metadata || !metadata.aniDBEpisodeNumber) return undefined
    // Return numbers only, remove all letters
    return Number(metadata.aniDBEpisodeNumber.replace(/\D/g, ""))
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
export function localFile_isMainWithValidEpisode<T extends {
    metadata: LocalFileMetadata
}>(props: T | null | undefined) {
    const metadata = props?.metadata
    return !!metadata && localFile_isValidEpisode(props) && !metadata.isSpecial && !metadata.isNC
}

/**
 * @description
 * - Returns `true` if `episode` and `aniDBEpisodeNumber` differ
 * @example
 * medata.episode = 1; medata.aniDBEpisodeNumber = "1" //=> False
 * medata.episode = 2; medata.aniDBEpisodeNumber = "S2" //=> False
 * medata.episode = 1; medata.aniDBEpisodeNumber = "2" //=> True
 * @param props
 */
export function localFile_episodeMappingDiffers<T extends {
    metadata: LocalFileMetadata
}>(props: T | null | undefined) {
    const metadata = props?.metadata
    const episode = localFile_getEpisode(props)
    return !!metadata
        && localFile_episodeExists(props)
        && !!metadata.aniDBEpisodeNumber
        && episode !== localFile_getAniDBEpisodeInteger(props)
}
