import { useAtom, useAtomValue } from "jotai/react"
import { useMemo } from "react"
import { logger } from "@/lib/helpers/debug"
import { splitAtom } from "jotai/utils"
import { localFilesAtom } from "@/atoms/library/local-file.atoms"
import { Atom, atom } from "jotai"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { useSelectAtom, useStableSelectAtom } from "@/atoms/helpers"
import { allUserMediaAtom } from "@/atoms/anilist/media.atoms"
import orderBy from "lodash/orderBy"
import { anilistCollectionEntriesAtom, AnilistCollectionEntry } from "@/atoms/anilist/entries.atoms"
import { path_getDirectoryName } from "@/lib/helpers/path"
import { LocalFile } from "@/lib/local-library/types"

export type LibraryEntry = {
    id: number // Media ID
    media: AnilistShowcaseMedia
    files: LocalFile[]
    collectionEntry: AnilistCollectionEntry
    sharedPath: string
}

/**
 * @description
 * - Derived from `allUserMediaAtom` and `localFilesAtom`
 */
export const libraryEntriesAtom = atom(get => {
    logger("atom/libraryEntriesAtom").warning("Derived")
    // Get all `mediaId`s
    const mediaIds = new Set(get(allUserMediaAtom).map(media => media?.id).filter(Boolean))
    // For each mediaId, create a new [LibraryEntry] from the existing [LocalFile]s
    return [...mediaIds].map(mediaId => {
        const firstFile = get(localFilesAtom).find(file => file.mediaId === mediaId)
        if (firstFile) {
            // Entry
            return {
                id: mediaId,
                media: get(allUserMediaAtom).filter(Boolean).find(media => media.id === mediaId)!,
                files: get(localFilesAtom).filter(file => file.mediaId === mediaId),
                collectionEntry: get(anilistCollectionEntriesAtom).find(entry => entry?.media?.id === mediaId),
                sharedPath: path_getDirectoryName(firstFile.path),
            } satisfies LibraryEntry
        }
    }).filter(Boolean).filter(entry => entry.files.length > 0) as LibraryEntry[]
})

/* -------------------------------------------------------------------------------------------------
 * Read
 * -----------------------------------------------------------------------------------------------*/

const sortedLibraryEntriesAtom = atom(get => {
    return orderBy(get(libraryEntriesAtom), [
        n => n.collectionEntry?.status === "CURRENT",
        n => n.collectionEntry?.status === "PAUSED",
        n => n.collectionEntry?.status === "PLANNING",
        n => n.media.title?.userPreferred,
    ], ["desc", "desc", "desc", "asc"])
})

/**
 * Split main atom into [LibraryEntry] atoms by media ID
 */
export const libraryEntryAtoms = splitAtom(sortedLibraryEntriesAtom, entry => entry.id)

/**
 * Derived filtered atoms
 */
export const currentlyWatching_libraryEntryAtoms = splitAtom(atom(get => {
    return orderBy(get(libraryEntriesAtom).filter(n => n.collectionEntry?.status === "CURRENT"), [
            n => n.collectionEntry?.startedAt,
        ], ["asc"])
    },
), entry => entry.id)


/**
 * Derived filtered atoms
 */
export const completed_libraryEntryAtoms = splitAtom(atom(get => {
        return get(sortedLibraryEntriesAtom).filter(n => n.collectionEntry?.status === "COMPLETED")
    },
), entry => entry.id)

/**
 * Derived filtered atoms
 */
export const rest_libraryEntryAtoms = splitAtom(atom(get => {
        return get(sortedLibraryEntriesAtom).filter(n => n.collectionEntry?.status !== "CURRENT" && n.collectionEntry?.status !== "COMPLETED")
    },
), entry => entry.id)


/**
 * @description
 * - Get [LibraryEntry] atom by media ID
 * @example
 * const getLibraryEntry = useSetAtom(getLibraryEntryAtomsByMediaIdAtom)
 * const latestFile = getLibraryEntry(21)
 */
export const getLibraryEntryAtomByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => get(libraryEntryAtoms).find((fileAtom) => get(fileAtom).id === mediaId),
)

/**
 * @description
 * - Useful to get the state of a [LibraryEntry]
 * - /!\ Do not use to get nested information like `media`, use `allUserMediaAtom` instead
 *
 * @example Parent
 * const libraryEntryAtoms = useLocalFileAtomsByMediaId(21)
 *  ...
 * libraryEntryAtoms.map(entryAtom => <Child key={`${entryAtom}`} entryAtom={entryAtom}/>
 *
 * @example Children
 * const entry = useAtomValue(entryAtom)
 */
export const useLibraryEntryAtomByMediaId = (mediaId: number) => {
    // Refresh atom when its file count changes
    const fileCount = useStableSelectAtom(libraryEntriesAtom, entries => entries.find(entry => entry.media.id === mediaId)?.files.length)
    const [, get] = useAtom(getLibraryEntryAtomByMediaIdAtom)
    return useMemo(() => get(mediaId), [(fileCount || 0)]) as Atom<LibraryEntry> | undefined
}

/**
 * @description
 * - Useful to display a list of [LibraryEntry]s
 */
export const useLibraryEntryAtoms = () => {
    // Refresh entry atom list when number of entries changes
    const entryCount = useSelectAtom(libraryEntriesAtom, entries => entries.flatMap(entry => entry.id))
    const value = useAtomValue(libraryEntryAtoms)
    return useMemo(() => value, [entryCount]) as Array<Atom<LibraryEntry>>
}
