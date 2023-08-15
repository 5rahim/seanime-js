import { atomWithStorage } from "jotai/utils"
import { LocalFile } from "@/lib/local-library/local-file"
import { useAtom } from "jotai/react"

/* -------------------------------------------------------------------------------------------------
 * Library Entries
 * -----------------------------------------------------------------------------------------------*/

/**
 * Store the library entries upon scan
 */

/**
 * TODO: For each entry with no media, use MAL to return a bunch of suggestions using a parsed title from sharedPath OR one file
 */

/* -------------------------------------------------------------------------------------------------
 * Local files
 * -----------------------------------------------------------------------------------------------*/

/**
 * We store the scanned [LocalFile]s from the local directory
 * - The user should preferably scan the local library once
 * - We will use the [LocalFile]s stored to organize the library entries
 */
export const localFilesAtom = atomWithStorage<LocalFile[]>("sea-local-files", [])

export function useStoredLocalFiles() {

    const [value, setter] = useAtom(localFilesAtom)

    return {
        localFiles: value,
        storeLocalFiles: setter,
    }

}
