import { atomWithStorage, selectAtom, splitAtom } from "jotai/utils"
import { useAtom, useAtomValue, useSetAtom } from "jotai/react"
import { withImmer } from "jotai-immer"
import { useCallback, useMemo } from "react"
import { atom, PrimitiveAtom } from "jotai"
import deepEquals from "fast-deep-equal"
import { focusAtom } from "jotai-optics"
import { anilistCollectionEntryAtoms, useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist/entries.atoms"
import { useStableSelectAtom } from "@/atoms/helpers"
import { LocalFile } from "@/lib/local-library/types"
import sortBy from "lodash/sortBy"
import { Nullish } from "@/types/common"
import { localFile_isMain } from "@/lib/local-library/utils/episode.utils"
import {
    anilist_canTrackProgress,
    anilist_getCurrentEpisodeCeilingFromMedia,
    anilist_uniquelyIncludesEpisodeZero,
} from "@/lib/anilist/utils"
import { allUserMediaAtom } from "@/atoms/anilist/media.atoms"
import { AniZipData } from "@/lib/anizip/types"
import { MediaDownloadInfo } from "@/lib/download/media-download-info"

/* -------------------------------------------------------------------------------------------------
 * [LocalFile] atoms
 * -----------------------------------------------------------------------------------------------*/

/**
 * @description Purpose
 * - Store the scanned [LocalFile]s from the local directory
 * - Used to derive other atoms like `libraryEntryAtoms`
 */
export const localFilesAtom = atomWithStorage<LocalFile[]>("sea-local-files", [], undefined, { unstable_getOnInit: true })

/**
 * Split [LocalFile]s into multiple atoms by `path`
 */
export const localFileAtoms = splitAtom(localFilesAtom, localFile => localFile.path)

/**
 * Derived atom for updates using Immer
 */
const localFilesAtomWithImmer = withImmer(localFilesAtom)

/**
 * @internal
 */
const __localFiles_globalUpdateAtom = atom(0)


/* -------------------------------------------------------------------------------------------------
 * Read [LocalFile]s
 * -----------------------------------------------------------------------------------------------*/

/**
 * @description
 * Get [LocalFile] atoms by `mediaId`
 */
export const getLocalFileAtomsByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId),
)
// Previous version
// export const getLocalFileAtomsByMediaIdAtom = atom(null,
//     (get, set, mediaId: number) => get(localFileAtoms).filter((fileAtom) => get(atom((get) => get(fileAtom).mediaId === mediaId)))
// )

/* -------------------------------------------------------------------------------------------------
 * Details
 * - Get details and utils about a specific entry
 * -----------------------------------------------------------------------------------------------*/

export const getLibraryEntryDynamicDetailsAtom = atom(null,
    (get, set, payload: { mediaId: number, aniZipData?: AniZipData }) => {
        const { mediaId, aniZipData } = payload
        // Get file atoms
        const fileAtoms = get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId)
        // Get AniList collection entry
        const collectionEntryAtom = get(anilistCollectionEntryAtoms).find((collectionEntryAtom) => get(collectionEntryAtom)?.media?.id === mediaId)
        // Get the AniList Collection Entry
        const collectionEntry = !!collectionEntryAtom ? get(collectionEntryAtom) : undefined
        // Get media
        const media = get(allUserMediaAtom).find(media => media.id === mediaId)
        // Get max episode, whether
        const epCeiling = anilist_getCurrentEpisodeCeilingFromMedia(media)
        // Get main episodes (episode files that are not specials or NCs or movie files)
        const mainFileAtoms = sortBy(fileAtoms, fileAtom => Number(get(fileAtom).parsedInfo?.episode)).filter(fileAtom => localFile_isMain(get(fileAtom))) ?? []

        if (!collectionEntry || !media) return {
            canTrackProgress: false, progress: 0, specialIsIncluded: false, episodeProgress: 0, latestFile: undefined,
        }

        /* Details */

        /**
         * [EPISODE-ZERO-SUPPORT]
         * - Whether downloaded episodes include a special episode "0" and no episode number is equal to the max episode number
         * - This treats AniDB as the source of truth when it comes to episode numbers
         *      - If in turn AniDB also includes Episode 0, then we need to alert the user to offset their episode numbers by +1
         * - e.g., epCeiling = 13 AND downloaded episodes = [0,...,12] //=> true
         * -      epCeiling = 13 AND downloaded episodes = [1,...,13] //=> false
         * @description
         * - If this is TRUE, then we treat episode numbers as 0-indexed. We need to offset the episode numbers by -1
         * - Since updating progress is based on episode numbers, we offset anilist progress by +1
         *
         * Areas affected: "missing-episodes.tsx", "undownloaded-episodes.tsx", "episode-item.tsx", "episode-section-slider.tsx", "continue-watching.tsx", "media-download-info.ts", "progress-tracking.tsx"
         */
        const specialIsIncluded = mainFileAtoms.findIndex(fileAtom => get(fileAtom).metadata.episode === 0) !== -1
            && mainFileAtoms.every(fileAtom => get(fileAtom).metadata.episode !== epCeiling)
            && !(media?.episodes === 1 || media?.format === "MOVIE")

        // There are some episodes that have not been watched
        const canTrackProgress = mainFileAtoms.length > 0 && anilist_canTrackProgress(media, collectionEntry.progress)

        // AniList progress
        const progress = collectionEntry.progress ?? 0
        /**
         * - Offset the progress by 1 IF the library includes a special episode "0" as a main episode.
         * - e,g., anilist progress = 1 AND specialIsIncluded = true //=> episodeProgress = 0
         * - e,g., anilist progress = 2 AND specialIsIncluded = true //=> episodeProgress = 1
         * @description Purpose
         * - Use this to get the next episode number to watch
         * - Use this to filter out the episodes that have been watched
         */
        const episodeProgress = (specialIsIncluded && progress !== 0) ? progress - 1 : progress

        /**
         * Get the latest downloaded file
         * - Downloaded file with the highest episode number
         */
        const latestFileAtom = sortBy(mainFileAtoms, fileAtom => get(fileAtom).metadata.episode)[mainFileAtoms.length - 1]
        const latestFile = !!latestFileAtom ? get(latestFileAtom) : undefined

        /**
         * Re-adjust download info to account for mismatched based on AniDB
         * - This is meant as correction for those library entries that have episode 0
         */
        const getCorrectedDownloadInfo = (downloadInfo: MediaDownloadInfo, aniZipData?: AniZipData) => {
            if (!aniZipData) return downloadInfo
            let episodeNumbers = downloadInfo.episodeNumbers
            /**
             * [EPISODE-ZERO-SUPPORT] FIX MAPPING MISMATCH
             * - Check if the mapping is different between AniList and AniZip (AniList includes episode 0)
             * - If it is AND downloadInfo hasn't detected it, then we need to include episode 0 in the list
             * - If it is not AND downloadInfo has detected Episode 0, then we need to offset the list by 1
             */
            if (anilist_uniquelyIncludesEpisodeZero(media, aniZipData) && !specialIsIncluded) {
                episodeNumbers = [0, ...downloadInfo.episodeNumbers.slice(0, -1)]
            } else if (anilist_uniquelyIncludesEpisodeZero(media, aniZipData) && specialIsIncluded) {
                episodeNumbers = downloadInfo.episodeNumbers.map(num => num + 1)
            }
            return { ...downloadInfo, episodeNumbers }
        }

        return {
            specialIsIncluded: specialIsIncluded,
            progress: progress,
            episodeProgress: episodeProgress,
            canTrackProgress: canTrackProgress,
            latestFile: latestFile,
            getCorrectedDownloadInfo,
        }
    },
)


export function useLibraryEntryDynamicDetails(mediaId: number, aniZipData?: AniZipData) {
    const __ = __useListenToLocalFiles()
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(mediaId)
    const collectionEntry = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry)
    const get = useSetAtom(getLibraryEntryDynamicDetailsAtom)
    return useMemo(() => get({ mediaId, aniZipData }), [__, collectionEntry])
}

export type LibraryEntryDynamicDetails = ReturnType<typeof useLibraryEntryDynamicDetails>

/* -------------------------------------------------------------------------------------------------
 * Lists
 * -----------------------------------------------------------------------------------------------*/

/**
 * @description
 * Get **main** [LocalFile] atoms by `mediaId` for `view` page
 */
const get_Display_LocalFileAtomsByMediaIdAtom = atom(null,
    // Get the local files from a specific media, split the `watched` and `to watch` files by listening to a specific `anilistCollectionEntryAtom`
    (get, set, mediaId: number) => {

        const fileAtoms = get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId)
        const mainFileAtoms = sortBy(fileAtoms, fileAtom => Number(get(fileAtom).parsedInfo?.episode)).filter(fileAtom => localFile_isMain(get(fileAtom))) ?? []

        /**
         * [EPISODE-ZERO-SUPPORT]
         * - Here we use `episodeProgress` instead of `progress` because it is 0-indexed
         */
        const { canTrackProgress, episodeProgress, progress, specialIsIncluded } = set(getLibraryEntryDynamicDetailsAtom, { mediaId })

        /**
         * Get episodes to watch based on 0-indexed progress
         */
        const toWatch = canTrackProgress ? (mainFileAtoms?.filter(atom =>
            // [EPISODE-ZERO-SUPPORT] Will display all main files that have not been watched
            get(atom).metadata.episode! > episodeProgress
            // [EPISODE-ZERO-SUPPORT] Also display Episode 0 if it has not been watched
            || (get(atom).metadata.episode! === 0 && episodeProgress === 0 && progress === 0),
        ) ?? []) : []
        const watched = mainFileAtoms?.filter(atom => get(atom).metadata.episode! <= episodeProgress) ?? []

        return {
            toWatch: toWatch.length === 0 && watched.length === 0 ? mainFileAtoms || [] : toWatch,
            /**
             * - Can't track progress -> show all main files
             * - Can track progress -> show episode user needs to watch OR show all main files
             */
            toWatchSlider: (!canTrackProgress) ? [...mainFileAtoms].reverse() : (toWatch.length > 0 ? toWatch : [...mainFileAtoms].reverse()),
            allMain: mainFileAtoms,
            watched,
            specialIsIncluded,
        }

    },
)

const get_Special_LocalFileAtomsByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => {
        const fileAtoms = get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId)
        return sortBy(fileAtoms, fileAtom => Number(get(fileAtom).parsedInfo?.episode)).filter(fileAtom => {
            const file = get(fileAtom)
            return file.metadata.isSpecial
        }) ?? []
    },
)


const get_NC_LocalFileAtomsByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => {
        const fileAtoms = get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId)
        return sortBy(fileAtoms, fileAtom => Number(get(fileAtom).parsedInfo?.episode)).filter(fileAtom => {
            const file = get(fileAtom)
            return file.metadata.isNC
        }) ?? []
    },
)


const get_Unknown_LocalFileAtomsByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => {
        const fileAtoms = get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId)
        return fileAtoms.filter(fileAtom => Object.keys(get(fileAtom).metadata).length === 0)
    },
)

/**
 * Get ignored [LocalFile] atoms
 */
export const ignoredLocalFileAtomsAtom = atom((get) => get(localFileAtoms).filter((itemAtom) => get(itemAtom).ignored === true))

export const getLocalFileAtomByPathAtom = atom(null,
    (get, set, path: string) => get(localFileAtoms).find((itemAtom) => get(itemAtom).path === path),
)


/**
 * Get [LocalFile] by `name`
 * @example
 * const getFile = useSetAtom(getLocalFileByNameAtom)
 */
export const getLocalFileByNameAtom = atom(null, // Writable too
    (get, set, name: string) => get(focusAtom(localFilesAtom, optic => optic.find(file => file.name === name))),
)


/**
 * Get [LocalFile] by `path`
 * @example
 * const getFile = useSetAtom(getLocalFileByPathAtom)
 */
export const getLocalFileByPathAtom = atom(null, // Writable too
    (get, set, path: string) => get(focusAtom(localFilesAtom, optic => optic.find(file => file.path === path))),
)

/**
 * Get [LocalFile] with the highest episode number by `mediaId`
 * @return LocalFile
 */
export const getLatestMainLocalFileByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => {
        const fileAtoms = get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId && localFile_isMain(get(fileAtom)))
        const fileAtom = sortBy(fileAtoms, fileAtom => get(fileAtom).metadata.episode)[fileAtoms.length - 1]
        return !!fileAtom ? get(fileAtom) : undefined
    },
)


/**
 * @return LocalFile[]
 */
export const getLocalFilesByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => get(focusAtom(localFilesAtom, optic => optic.filter(file => file.mediaId === mediaId))),
)


const getSpecialEpisodeIncludedByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => {
        const fileAtoms = get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId)
        const media = get(allUserMediaAtom).find(media => media.id === mediaId)
        const maxEp = anilist_getCurrentEpisodeCeilingFromMedia(media)
        if (maxEp === 0) return false
        if (media?.episodes === 1 || media?.format === "MOVIE") return false
        return fileAtoms.findIndex(fileAtom => get(fileAtom).metadata.episode === 0) !== -1
            && fileAtoms.every(fileAtom => get(fileAtom).metadata.episode !== maxEp)
    },
)


export function useSpecialEpisodeIncludedInLibrary(mediaId: number) {
    const __ = __useListenToLocalFiles()
    const get = useSetAtom(getSpecialEpisodeIncludedByMediaIdAtom)
    return useMemo(() => get(mediaId), [__])
}



/**
 * @description Purpose
 * - Use for mapping
 * - Children will be able to modify a specific [LocalFile]
 * @example Parent
 * const localFileAtoms = useLocalFileAtomsByMediaId(props.mediaId)
 *  ...
 * localFileAtoms.map(fileAtom => <Child key={`${fileAtom}`} fileAtom={fileAtom}/>)
 *
 * @example Children
 * const { fileAtom } = props
 * const [file, setFile] = useImmerAtom(fileAtom)
 */
export const useLocalFileAtomsByMediaId = (mediaId: number) => {
    const [, get] = useAtom(getLocalFileAtomsByMediaIdAtom)
    const __ = __useListenToLocalFiles()
    return useMemo(() => get(mediaId), [__]) as Array<PrimitiveAtom<LocalFile>>
}

export const useDisplayLocalFileAtomsByMediaId = (mediaId: number) => {
    // Refresh file list when collection entry progress or status change
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(mediaId)
    const progress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress) ?? 0
    const status = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status) ?? ""
    const __ = __useListenToLocalFiles()

    const [, get] = useAtom(get_Display_LocalFileAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), [progress, status, __])
}

export const useSpecialsLocalFileAtomsByMediaId = (mediaId: number) => {
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(mediaId)
    const progress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress) ?? 0
    const status = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status) ?? ""
    const __ = __useListenToLocalFiles()

    const [, get] = useAtom(get_Special_LocalFileAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), [progress, status, __])
}

export const useNCLocalFileAtomsByMediaId = (mediaId: number) => {
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(mediaId)
    const progress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress) ?? 0
    const status = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status) ?? ""
    const __ = __useListenToLocalFiles()

    const [, get] = useAtom(get_NC_LocalFileAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), [progress, status, __])
}

export const useUnknownLocalFileAtomsByMediaId = (mediaId: number) => {
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(mediaId)
    const progress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress) ?? 0
    const status = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status) ?? ""
    const __ = __useListenToLocalFiles()

    const [, get] = useAtom(get_Unknown_LocalFileAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), [progress, status, __])
}

/**
 * @description Purpose
 * - Get all [LocalFile]s associated with a specific media
 * @description Caveats
 * - /!\ Unstable - Re-renders component when `localFilesAtom` is updated for that specific media
 * - Prefer atoms for mapping
 * @example
 * const files = useLocalFilesByMediaId_UNSTABLE(props.mediaId)
 * const allFilesLocked = files.every(file => file.locked)
 *
 * @param mediaId
 */
export const useLocalFilesByMediaId_UNSTABLE = (mediaId: Nullish<number>) => {
    return useAtomValue(
        selectAtom(
            localFilesAtom,
            useCallback(files => files.filter(file => file.mediaId === mediaId), []),
            deepEquals, // Equality check
        ),
    ) as LocalFile[]
}

/**
 * @description Purpose
 * - Get all **main** [LocalFile]s associated with a specific media
 * @param mediaId
 */
export const useMainLocalFilesByMediaId_UNSTABLE = (mediaId: Nullish<number>) => {
    return useAtomValue(
        selectAtom(
            localFilesAtom,
            useCallback(files => files.filter(file => localFile_isMain(file) && file.mediaId === mediaId,
            ).sort((a, b) => a.metadata.episode! - b.metadata.episode!), []),
            deepEquals, // Equality check
        ),
    ) as LocalFile[]
}

export const useLocalFileAtomByPath_UNSTABLE = (path: string) => {
    const __ = __useListenToLocalFiles()
    const [, get] = useAtom(getLocalFileAtomByPathAtom)
    return useMemo(() => get(path), [__])
}

export const useLatestMainLocalFileByMediaId_UNSTABLE = (mediaId: number) => {
    const __ = __useListenToLocalFiles()
    const get = useSetAtom(getLatestMainLocalFileByMediaIdAtom)
    return useMemo(() => get(mediaId), [__])
}


/* -------------------------------------------------------------------------------------------------
 * Write
 * -----------------------------------------------------------------------------------------------*/

/**
 * @description Update local files using Immer
 * @example
 * const setLocalFiles = useSetLocalFiles()
 *
 * setFiles(draft => {
 *     for (const draftFile of draft) {
 *         if (draftFile[property] === value) {
 *             draftFile.locked = !allFilesLocked
 *         }
 *     }
 *     return
 * })
 */
export const useSetLocalFiles = () => {
    return useSetAtom(localFilesAtomWithImmer)
}

/* -------------------------------------------------------------------------------------------------
 * Re-rendering
 * -----------------------------------------------------------------------------------------------*/

/**
 * - Tell components that read local fil`s by way of `atoms` to re-render when local files are updated
 */
export const __useRerenderLocalFiles = () => {
    const emit = useSetAtom(__localFiles_globalUpdateAtom)
    return useCallback(() => {
        emit(prev => prev + 1)
    }, [])
}

/**
 * @description
 * - Emits a global update when local files are updated
 * - Force re-render of components that read local file atoms using getters
 * - /!\ Hoist only where you display local files for a specific media
 * @example
 * const __ = __useListenToLocalFiles()
 *
 * const file = useMemo(() => getFile(path), [__])
 */
export const __useListenToLocalFiles = () => {
    return useAtomValue(__localFiles_globalUpdateAtom)
}
