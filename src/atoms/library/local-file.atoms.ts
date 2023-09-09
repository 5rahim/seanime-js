import { atomWithStorage, selectAtom, splitAtom } from "jotai/utils"
import { LocalFile } from "@/lib/local-library/local-file"
import { useAtom, useAtomValue, useSetAtom } from "jotai/react"
import { withImmer } from "jotai-immer"
import { useCallback, useMemo } from "react"
import { atom, PrimitiveAtom } from "jotai"
import deepEquals from "fast-deep-equal"
import _ from "lodash"
import { ANIDB_RX } from "@/lib/series-scanner/regex"
import { focusAtom } from "jotai-optics"
import { anilistCollectionEntryAtoms, useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist/entries.atoms"
import { useStableSelectAtom } from "@/atoms/helpers"

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

        const maxEp = (collectionEntry?.media?.nextAiringEpisode?.episode ? collectionEntry?.media?.nextAiringEpisode?.episode - 1 : undefined) || collectionEntry?.media?.episodes
        const canTrackProgress = mainFileAtoms.length > 0 && !!maxEp && (!!collectionEntry?.progress && collectionEntry.progress < Number(maxEp) || !collectionEntry?.progress)
        // /\ (!progress || progress < maxEp) && progress !== maxEp

        const toWatch = canTrackProgress ? (mainFileAtoms?.filter(n => !!get(n).metadata.episode && get(n).metadata.episode! > collectionEntry?.progress!) ?? []) : []
        return {
            toWatch,
            toWatchSlider: (!canTrackProgress) ? [...mainFileAtoms].reverse() : toWatch,
            watched: mainFileAtoms?.filter(n => !!get(n).metadata.episode && get(n).metadata.episode! <= collectionEntry?.progress!) ?? [],
        }

    },
)

/**
 * @return PrimitiveAtom<LocalFile>[]
 */
const get_OVA_LocalFileAtomsByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => {
        const fileAtoms = get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId)
        return _.sortBy(fileAtoms, fileAtom => Number(get(fileAtom).parsedInfo?.episode)).filter(fileAtom => {
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
        return _.sortBy(fileAtoms, fileAtom => Number(get(fileAtom).parsedInfo?.episode)).filter(fileAtom => {
            const file = get(fileAtom)
            return file.metadata.isNC
        }) ?? []
    },
)

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
 * Get latest [LocalFile] by `mediaId` sorted by episode number
 * @return LocalFile
 */
export const getLastMainLocalFileByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => {
        const fileAtoms = get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId && !get(fileAtom).metadata.isSpecial && !get(fileAtom).metadata.isNC)
        const fileAtom = _.sortBy(fileAtoms, fileAtom => get(fileAtom).metadata.episode)[fileAtoms.length - 1]
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
    // Actualize file list when collection entry progress or status change
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(mediaId)
    const progress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress) ?? 0
    const status = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status) ?? ""

    const [, get] = useAtom(get_Main_LocalFileAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), [progress, status]) as {
        toWatch: Array<PrimitiveAtom<LocalFile>>,
        toWatchSlider: Array<PrimitiveAtom<LocalFile>>
        watched: Array<PrimitiveAtom<LocalFile>>
    }
}
export const useSpecialsLocalFileAtomsByMediaId = (mediaId: number) => {
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(mediaId)
    const progress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress) ?? 0
    const status = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status) ?? ""

    const [, get] = useAtom(get_OVA_LocalFileAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), [progress, status]) as Array<PrimitiveAtom<LocalFile>>
}
export const useNCLocalFileAtomsByMediaId = (mediaId: number) => {
    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(mediaId)
    const progress = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress) ?? 0
    const status = useStableSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status) ?? ""

    const [, get] = useAtom(get_NC_LocalFileAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), [progress, status]) as Array<PrimitiveAtom<LocalFile>>
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
export const useLocalFilesByMediaId_UNSTABLE = (mediaId: number) => {
    return useAtomValue(
        selectAtom(
            localFilesAtom,
            useCallback(files => files.filter(file => file.mediaId === mediaId), []),
            deepEquals, // Equality check
        ),
    )
}

export const useLocalFileAtomByPath = (path: string) => {
    const [, get] = useAtom(getLocalFileAtomByPathAtom)
    return useMemo(() => get(path), []) as (PrimitiveAtom<LocalFile> | undefined)
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
