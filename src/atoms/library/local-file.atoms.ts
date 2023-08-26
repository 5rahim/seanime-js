import { atomWithStorage, selectAtom, splitAtom } from "jotai/utils"
import { LocalFile } from "@/lib/local-library/local-file"
import { useAtom, useAtomValue, useSetAtom } from "jotai/react"
import { withImmer } from "jotai-immer"
import { useCallback, useMemo } from "react"
import { atom, PrimitiveAtom } from "jotai"
import deepEquals from "fast-deep-equal"
import _ from "lodash"
import { ANIDB_RX } from "@/lib/series-scanner/regex"
import { anilistCollectionEntryAtoms, useAnilistCollectionEntryByMediaId } from "@/atoms/anilist-collection"
import { valueContainsNC, valueContainsOVA } from "@/lib/anilist/helpers.shared"

/* -------------------------------------------------------------------------------------------------
 * Main atoms
 * -----------------------------------------------------------------------------------------------*/

/**
 * We store the scanned [LocalFile]s from the local directory
 * - We will use the [LocalFile]s stored to organize the library entries
 */
export const localFilesAtom = atomWithStorage<LocalFile[]>("sea-local-files", [], undefined, { unstable_getOnInit: true })

// Split [LocalFile] into multiple atom by `path`
export const localFileAtoms = splitAtom(localFilesAtom, localFile => localFile.path)

// Derived atom for updates using Immer
const localFilesAtomWithImmer = withImmer(localFilesAtom)


/* -------------------------------------------------------------------------------------------------
 * Read
 * -----------------------------------------------------------------------------------------------*/

/**
 * Get [LocalFile] atoms by `mediaId`
 * @example Previous version
 * // export const getLocalFileAtomsByMediaIdAtom = atom(null,
 * //     (get, set, mediaId: number) => get(localFileAtoms).filter((itemAtom) => get(atom((get) => get(itemAtom).mediaId === mediaId)))
 * // )
 */
export const getLocalFileAtomsByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId),
)

const get_Main_LocalFileAtomsByMediaIdAtom = atom(null,
    // Get the local files from a specific media, split the `watched` and `to watch` files by listening to a specific `anilistCollectionEntryAtom`
    (get, set, mediaId: number) => {
        // Get the AniList Collection Entry Atom by media ID
        const collectionEntryAtom = get(anilistCollectionEntryAtoms).find((collectionEntryAtom) => get(collectionEntryAtom)?.media?.id === mediaId)
        // Get the value
        const collectionEntry = !!collectionEntryAtom ? get(collectionEntryAtom) : undefined
        // Get the local file atoms by media ID
        const fileAtoms = get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId)
        // Sort the local files atoms by episode number
        const mainFileAtoms = _.sortBy(fileAtoms, fileAtom => Number(get(fileAtom).parsedInfo?.episode)).filter(fileAtom => {
            const file = get(fileAtom)
            return !ANIDB_RX[0].test(file.path) && !ANIDB_RX[1].test(file.path) && !ANIDB_RX[2].test(file.path) &&
                !ANIDB_RX[4].test(file.path) && !ANIDB_RX[5].test(file.path) && !ANIDB_RX[6].test(file.path)
        }) ?? []

        if (mainFileAtoms.length > 0 && !!collectionEntry?.progress && !!collectionEntry.media?.episodes && !(collectionEntry.progress === Number(collectionEntry.media.episodes))) {
            return {
                toWatch: mainFileAtoms?.slice(collectionEntry.progress) ?? [],
                watched: mainFileAtoms?.slice(0, collectionEntry.progress) ?? [],
            }
        } else {
            return {
                toWatch: mainFileAtoms ?? [],
                watched: [],
            }
        }
    },
)


const get_OVA_LocalFileAtomsByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => {
        const fileAtoms = get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId)
        return _.sortBy(fileAtoms, fileAtom => Number(get(fileAtom).parsedInfo?.episode)).filter(fileAtom => {
            const file = get(fileAtom)
            return valueContainsOVA(file.path)
        }) ?? []
    },
)

const get_NC_LocalFileAtomsByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => {
        const fileAtoms = get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId)
        return _.sortBy(fileAtoms, fileAtom => Number(get(fileAtom).parsedInfo?.episode)).filter(fileAtom => {
            const file = get(fileAtom)
            return valueContainsNC(file.path)
        }) ?? []
    },
)

/**
 * Get [LocalFile] atom by `path`
 */
export const getLocalFileAtomByPathAtom = atom(null,
    (get, set, path: string) => get(localFileAtoms).find((itemAtom) => get(itemAtom).path === path),
)

/**
 * Useful for mapping. When you want the children to modify a specific [LocalFile]
 * @example Parent
 * const localFileAtoms = useLocalFileAtomsByMediaId(props.mediaId)
 *  ...
 * localFileAtoms.map(fileAtom => <Child key={`${fileAtom}`} fileAtom={fileAtom}/>
 *
 * @example Children
 * const [file, setFile] = useImmerAtom(fileAtom)
 */
export const useLocalFileAtomsByMediaId = (mediaId: number) => {
    const [, get] = useAtom(getLocalFileAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), []) as Array<PrimitiveAtom<LocalFile>>
}

export const useMainLocalFileAtomsByMediaId = (mediaId: number) => {
    // Actualize file list when collection entry changes
    const collectionEntry = useAnilistCollectionEntryByMediaId(mediaId)
    const [, get] = useAtom(get_Main_LocalFileAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), [collectionEntry]) as {
        toWatch: Array<PrimitiveAtom<LocalFile>>,
        watched: Array<PrimitiveAtom<LocalFile>>
    }
}
export const useOVALocalFileAtomsByMediaId = (mediaId: number) => {
    // Actualize file list when collection entry changes
    const collectionEntry = useAnilistCollectionEntryByMediaId(mediaId)
    const [, get] = useAtom(get_OVA_LocalFileAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), [collectionEntry]) as Array<PrimitiveAtom<LocalFile>>
}
export const useNCLocalFileAtomsByMediaId = (mediaId: number) => {
    // Actualize file list when collection entry changes
    const collectionEntry = useAnilistCollectionEntryByMediaId(mediaId)
    const [, get] = useAtom(get_NC_LocalFileAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), [collectionEntry]) as Array<PrimitiveAtom<LocalFile>>
}

/**
 * Returns a memoized value containing [LocalFile]s with the same `mediaId`
 * Useful for getting general information about that group of [LocalFile]s
 *
 * @example
 * const files = useLocalFilesByMediaId(props.mediaId)
 * const allFilesLocked = files.every(file => file.locked)
 *
 * @param mediaId
 */
export const useLocalFilesByMediaId = (mediaId: number) => {
    return useAtomValue(
        selectAtom(
            localFilesAtom,
            useCallback(files => files.filter(file => file.mediaId === mediaId), []), // Stable reference
            deepEquals, // Equality check
        ),
    )
}

export const useLocalFileAtomByPath = (path: string) => {
    const [, get] = useAtom(getLocalFileAtomByPathAtom)
    return useMemo(() => get(path), []) as (PrimitiveAtom<LocalFile> | undefined)
}

/**
 * Locked, ignored paths
 */

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
