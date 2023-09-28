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
import { anilist_getEpisodeCeilingFromMedia } from "@/lib/anilist/utils"

/* -------------------------------------------------------------------------------------------------
 * Main atoms
 * -----------------------------------------------------------------------------------------------*/

/**
 * We store the scanned [LocalFile]s from the local directory
 * - We will use the [LocalFile]s stored to organize the library entries
 */
export const localFilesAtom = atomWithStorage<LocalFile[]>("sea-local-files", [], undefined, { unstable_getOnInit: true })

// Split [LocalFile]s into multiple atoms by `path`
export const localFileAtoms = splitAtom(localFilesAtom, localFile => localFile.path)

// Derived atom for updates using Immer
const localFilesAtomWithImmer = withImmer(localFilesAtom)

const __localFiles_globalUpdateAtom = atom(0)


/* -------------------------------------------------------------------------------------------------
 * Read
 * -----------------------------------------------------------------------------------------------*/

/**
 * Get [LocalFile] atoms by `mediaId`
 * @example Previous version
 * // export const getLocalFileAtomsByMediaIdAtom = atom(null,
 * //     (get, set, mediaId: number) => get(localFileAtoms).filter((itemAtom) => get(atom((get) => get(itemAtom).mediaId === mediaId)))
 * // )
 * @return PrimitiveAtom<LocalFile>[]
 */
export const getLocalFileAtomsByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId),
)

/**
 * @return {
 *     toWatch: PrimitiveAtom<LocalFile>[],
 *     watched: PrimitiveAtom<LocalFile>[]
 * }
 */
const get_Display_LocalFileAtomsByMediaIdAtom = atom(null,
    // Get the local files from a specific media, split the `watched` and `to watch` files by listening to a specific `anilistCollectionEntryAtom`
    (get, set, mediaId: number) => {
        // Get the AniList Collection Entry Atom by media ID
        const collectionEntryAtom = get(anilistCollectionEntryAtoms).find((collectionEntryAtom) => get(collectionEntryAtom)?.media?.id === mediaId)
        // Get the AniList Collection Entry
        const collectionEntry = !!collectionEntryAtom ? get(collectionEntryAtom) : undefined
        // Get the local file atoms by media ID
        const fileAtoms = get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId)
        // Sort the local files atoms by parsed episode number
        const mainFileAtoms = sortBy(fileAtoms, fileAtom => Number(get(fileAtom).parsedInfo?.episode)).filter(fileAtom => localFile_isMain(get(fileAtom))) ?? []

        const maxEp = anilist_getEpisodeCeilingFromMedia(collectionEntry?.media)

        // There are some episodes that have not been watched
        const canTrackProgress = mainFileAtoms.length > 0 && !!maxEp && (!!collectionEntry?.progress && collectionEntry.progress < Number(maxEp) || !collectionEntry?.progress)

        const toWatch = canTrackProgress ? (mainFileAtoms?.filter(atom => get(atom).metadata.episode! > collectionEntry?.progress! || get(atom).metadata.episode === 0 && (collectionEntry?.progress || 0) === 0) ?? []) : []
        const watched = mainFileAtoms?.filter(atom => get(atom).metadata.episode! <= collectionEntry?.progress!) ?? []

        const mediaIncludesSpecial =
            mainFileAtoms.findIndex(fileAtom => get(fileAtom).metadata.episode === 0) !== -1
            && mainFileAtoms.every(fileAtom => get(fileAtom).metadata.episode !== maxEp)
            && mainFileAtoms.every(fileAtom => !get(fileAtom).metadata.aniDBMediaInfo || get(fileAtom).metadata.aniDBMediaInfo!.episodeCount < maxEp)

        return {
            toWatch: toWatch.length === 0 && watched.length === 0 ? mainFileAtoms || [] : toWatch,
            // Can't track progress -> show all main files
            // Can track progress -> show episode user needs to watch OR show all main files
            toWatchSlider: (!canTrackProgress) ? [...mainFileAtoms].reverse() : (toWatch.length > 0 ? toWatch : [...mainFileAtoms].reverse()),
            allMain: mainFileAtoms,
            watched,
            mediaIncludesSpecial,
        }

    },
)

/**
 * @return PrimitiveAtom<LocalFile>[]
 */
const get_OVA_LocalFileAtomsByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => {
        const fileAtoms = get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId)
        return sortBy(fileAtoms, fileAtom => Number(get(fileAtom).parsedInfo?.episode)).filter(fileAtom => {
            const file = get(fileAtom)
            return file.metadata.isSpecial
        }) ?? []
    },
)

/**
 * @return <PrimitiveAtom<LocalFile>[]
 */
const get_NC_LocalFileAtomsByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => {
        const fileAtoms = get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId)
        return sortBy(fileAtoms, fileAtom => Number(get(fileAtom).parsedInfo?.episode)).filter(fileAtom => {
            const file = get(fileAtom)
            return file.metadata.isNC
        }) ?? []
    },
)

/**
 * @return PrimitiveAtom<LocalFile>[]
 */
export const ignoredLocalFileAtomsAtom = atom((get) => get(localFileAtoms).filter((itemAtom) => get(itemAtom).ignored === true))

/**
 * @return PrimitiveAtom<LocalFile>
 */
export const getLocalFileAtomByPathAtom = atom(null,
    (get, set, path: string) => get(localFileAtoms).find((itemAtom) => get(itemAtom).path === path),
)


/**
 * @return LocalFile
 * @example
 * const getFile = useSetAtom(getLocalFileByNameAtom)
 */
export const getLocalFileByNameAtom = atom(null, // Writable too
    (get, set, name: string) => get(focusAtom(localFilesAtom, optic => optic.find(file => file.name === name))),
)

/**
 * @return LocalFile
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


/**
 * Useful for mapping. When you want the children to modify a specific [LocalFile]
 * @example Parent
 * const localFileAtoms = useLocalFileAtomsByMediaId(props.mediaId)
 *  ...
 * localFileAtoms.map(fileAtom => <Child key={`${fileAtom}`} fileAtom={fileAtom}/>)
 *
 * @example Children
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
    return useMemo(() => get(mediaId), [progress, status, __]) as {
        toWatch: Array<PrimitiveAtom<LocalFile>>,
        toWatchSlider: Array<PrimitiveAtom<LocalFile>>
        watched: Array<PrimitiveAtom<LocalFile>>
        allMain: Array<PrimitiveAtom<LocalFile>>
        mediaIncludesSpecial: boolean
    }
}

export const useSpecialsLocalFileAtomsByMediaId = (mediaId: number) => {
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(mediaId)
    const progress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress) ?? 0
    const status = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status) ?? ""
    const __ = __useListenToLocalFiles()

    const [, get] = useAtom(get_OVA_LocalFileAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), [progress, status, __]) as Array<PrimitiveAtom<LocalFile>>
}

export const useNCLocalFileAtomsByMediaId = (mediaId: number) => {
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(mediaId)
    const progress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress) ?? 0
    const status = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status) ?? ""
    const __ = __useListenToLocalFiles()

    const [, get] = useAtom(get_NC_LocalFileAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), [progress, status, __]) as Array<PrimitiveAtom<LocalFile>>
}

/**
 * /!\ Unstable - Re-renders component when `localFilesAtom` is updated
 *
 * @example
 * const files = useLocalFilesByMediaId(props.mediaId)
 * const allFilesLocked = files.every(file => file.locked)
 *
 * @param mediaId
 */
export const useLocalFilesByMediaId_UNSTABLE = (mediaId: Nullish<number>) => {
    const __ = __useListenToLocalFiles()
    return useAtomValue(
        selectAtom(
            localFilesAtom,
            useCallback(files => files.filter(file => file.mediaId === mediaId), [__]),
            deepEquals, // Equality check
        ),
    )
}
export const useMainLocalFilesByMediaId_UNSTABLE = (mediaId: Nullish<number>) => {
    const __ = __useListenToLocalFiles()
    return useAtomValue(
        selectAtom(
            localFilesAtom,
            useCallback(files => files.filter(file => localFile_isMain(file)
                && file.mediaId === mediaId,
            ).sort((a, b) => a.metadata.episode! - b.metadata.episode!), [__]),
            deepEquals, // Equality check
        ),
    )
}

export const useLocalFileAtomByPath = (path: string) => {
    const __ = __useListenToLocalFiles()
    const [, get] = useAtom(getLocalFileAtomByPathAtom)
    return useMemo(() => get(path), [__]) as (PrimitiveAtom<LocalFile> | undefined)
}

export const useLatestMainLocalFileByMediaId = (mediaId: number) => {
    const getLastFile = useSetAtom(getLatestMainLocalFileByMediaIdAtom)
    const __ = __useListenToLocalFiles()
    return useMemo(() => getLastFile(mediaId), [__])
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

export const __useRerenderLocalFiles = () => {
    const emit = useSetAtom(__localFiles_globalUpdateAtom)
    return useCallback(() => {
        emit(prev => prev + 1)
    }, [])
}

/**
 * @description Re-render on demand
 * @example
 * const __ = __useListenToLocalFiles()
 *
 * const file = useMemo(() => getFile(path), [__])
 */
export const __useListenToLocalFiles = () => {
    return useAtomValue(__localFiles_globalUpdateAtom)
}
