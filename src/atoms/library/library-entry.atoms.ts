import { useAtom, useAtomValue } from "jotai/react"
import { useMemo } from "react"
import { logger } from "@/lib/helpers/debug"
import { splitAtom } from "jotai/utils"
import { localFilesAtom } from "@/atoms/library/local-file.atoms"
import { atom, PrimitiveAtom } from "jotai"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { LocalFile } from "@/lib/local-library/local-file"
import { useSelectAtom } from "@/atoms/helpers"
import { allUserMediaAtom } from "@/atoms/anilist/media.atoms"
import _ from "lodash"
import { anilistCollectionEntriesAtom, AnilistCollectionEntry } from "@/atoms/anilist/entries.atoms"

/* -------------------------------------------------------------------------------------------------
 * LibraryEntry
 * - Derived from `allUserMediaAtom` and `localFilesAtom`
 * -----------------------------------------------------------------------------------------------*/

export type LibraryEntry = {
    id: number // Media ID
    media: AnilistShowcaseMedia
    files: LocalFile[]
    collectionEntry: AnilistCollectionEntry
    sharedPath: string
}
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
                sharedPath: firstFile.path.replace("\\" + firstFile.name, ""),
            } satisfies LibraryEntry
        }
    }).filter(Boolean).filter(entry => entry.files.length > 0) as LibraryEntry[]
})

/* -------------------------------------------------------------------------------------------------
 * Read
 * -----------------------------------------------------------------------------------------------*/

const sortedLibraryEntriesAtom = atom(get => {
    return _.orderBy(get(libraryEntriesAtom), [
        n => n.collectionEntry?.status === "CURRENT",
        n => n.collectionEntry?.status === "PAUSED",
        n => n.collectionEntry?.status === "PLANNING",
        n => n.media.title?.userPreferred,
    ], ["desc", "desc", "desc", "asc"])
})

export const libraryEntryAtoms = splitAtom(sortedLibraryEntriesAtom, entry => entry.id)

/**
 * @example
 * const getLastFile = useSetAtom(getLibraryEntryAtomsByMediaIdAtom)
 * const lastFile = getLastFile(21)
 */
export const getLibraryEntryAtomsByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => get(libraryEntryAtoms).find((fileAtom) => get(fileAtom).id === mediaId),
)

/**
 * Useful for mapping over [LibraryEntry]s
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
    const fileCount = useSelectAtom(localFilesAtom, files => files.filter(file => file.mediaId === mediaId).filter(Boolean).map(file => file.path))
    const [, get] = useAtom(getLibraryEntryAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), [fileCount]) as PrimitiveAtom<LibraryEntry> | undefined
}

/**
 * Used in local library to display anime list
 */
export const useLibraryEntryAtoms = () => {
    // Refresh entry atom list when number of entries changes
    const entryCount = useSelectAtom(libraryEntriesAtom, entries => entries.flatMap(entry => entry.id))
    const value = useAtomValue(libraryEntryAtoms)
    return useMemo(() => value, [entryCount]) as Array<PrimitiveAtom<LibraryEntry>>
}
