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

/**
 * @description
 * Get **main** [LocalFile] atoms by `mediaId` for `view` page
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
