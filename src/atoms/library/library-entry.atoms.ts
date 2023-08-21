import { useAtom, useAtomValue } from "jotai/react"
import { allUserMediaAtom } from "@/atoms/anilist-collection"
import { useCallback, useMemo } from "react"
import { logger } from "@/lib/helpers/debug"
import { selectAtom, splitAtom } from "jotai/utils"
import { localFilesAtom } from "@/atoms/library/local-file.atoms"
import { atom, PrimitiveAtom } from "jotai"
import deepEquals from "fast-deep-equal"
import { AnilistSimpleMedia } from "@/lib/anilist/fragment"
import { LocalFile } from "@/lib/local-library/local-file"
import { useSelectAtom } from "@/atoms/helpers"

/* -------------------------------------------------------------------------------------------------
 * LibraryEntry
 * - Derived from `allUserMediaAtom` and `localFilesAtom`
 * -----------------------------------------------------------------------------------------------*/

export type LibraryEntry = {
    id: number // Media ID
    media: AnilistSimpleMedia,
    files: LocalFile[]
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
                sharedPath: firstFile.path.replace("\\" + firstFile.name, ""),
            } satisfies LibraryEntry
        }
    }).filter(Boolean).filter(entry => entry.files.length > 0) as LibraryEntry[]
})

/* -------------------------------------------------------------------------------------------------
 * Read
 * -----------------------------------------------------------------------------------------------*/

export const libraryEntryAtoms = splitAtom(libraryEntriesAtom, entry => entry.id)

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
    const fileCount = useSelectAtom(localFilesAtom, files => files.filter(file => file.mediaId === mediaId).length ?? 0)
    const [, get] = useAtom(getLibraryEntryAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), [fileCount]) as PrimitiveAtom<LibraryEntry> | undefined
}

/**
 * Used in local library to display anime list
 */
export const useLibraryEntryAtoms = () => {
    // Refresh libraryEntry atom list when number of entries changes
    const entryCount = useSelectAtom(libraryEntriesAtom, entries => entries.length)
    const value = useAtomValue(libraryEntryAtoms)
    return useMemo(() => value, [entryCount]) as Array<PrimitiveAtom<LibraryEntry>>
}

/**
 * @example
 * const entry = useLibraryEntryByMediaId(21)
 *
 * const title = entry?.media?.title?.english //=> One Piece
 * const files = entry?.files //=> [{...}, ...]
 */
export const useLibraryEntryByMediaId = (mediaId: number): LibraryEntry | undefined => {
    return useAtomValue(
        selectAtom(
            libraryEntriesAtom,
            useCallback(entries => entries.find(entry => entry.media.id === mediaId), []), // Stable reference
            deepEquals, // Equality check
        ),
    )
}
