/**
 * Types related to the local library
 */
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"

// Hydrated before a file is matched
export type AnimeFileInfo = {
    original: string // File name
    title?: string
    releaseGroup?: string
    season?: string
    part?: string
    cour?: string
    episode?: string // Relative or absolute episode number
}

// Hydrated after a file is matched
export type LocalFileMetadata = {
    // Relative episode number
    episode?: number
    // Whether the file is an alternative version (e.g., episode 01v2, episode 24')
    isVersion?: boolean
    // Whether the file is a Special or OVA.
    // This should only be true when the file is matched with the original media (whose format is not Special/OVA)
    isSpecial?: boolean
    // Mapping to AniDB
    // This should be the same as `episode` unless the file is marked as Special/OVA
    aniDBEpisodeNumber?: string
    // OPs, EDs, Bonus content...
    isNC?: boolean
}

export type LocalFileAniDBInfo = {
    episodeCount: number,
    specialCount: number,
}

export type LocalFile = {
    name: string // File name (different from anime title)
    path: string // File path
    parsedFolderInfo: AnimeFileInfo[]
    parsedInfo: AnimeFileInfo | undefined
    metadata: LocalFileMetadata
    locked: boolean
    ignored: boolean
    mediaId: number | null
}

// Returned by [local-file/createLocalFileWithMedia]
export type LocalFileWithMedia = LocalFile & { media: AnilistShowcaseMedia | undefined }
