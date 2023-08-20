import { atomWithStorage } from "jotai/utils"
import { LocalFile } from "@/lib/local-library/local-file"
import { useAtomValue } from "jotai/react"
import { useImmerAtom } from "jotai-immer"
import { startTransition, useCallback, useMemo } from "react"
import { logger } from "@/lib/helpers/debug"
import { Nullish } from "@/types/common"

/**
 * We store the scanned [LocalFile]s from the local directory
 * - We will use the [LocalFile]s stored to organize the library entries
 */
export const localFilesAtom = atomWithStorage<LocalFile[]>("sea-local-files", [], undefined, { unstable_getOnInit: true })

export function useStoredLocalFiles() {

    const files = useAtomValue(localFilesAtom)
    const [, setFiles] = useImmerAtom(localFilesAtom)

    /**
     * Will keep locked and ignored files and insert new ones.
     *
     * Call this function when [refreshing entries]
     * @param files
     */
    const handleStoreLocalFiles = useCallback((incomingFiles: LocalFile[]) => {
        startTransition(() => {
            setFiles(files => {
                logger("atom/library/handleStoreLocalFiles").info("Incoming files", incomingFiles.length)
                const keptFiles = files.filter(file => file.ignored || file.locked)
                const keptFilesPaths = new Set<string>(keptFiles.map(file => file.path))
                return [...keptFiles, ...incomingFiles.filter(file => !keptFilesPaths.has(file.path))]
            })
        })
    }, [])

    const markedFiles = useMemo(() => {
        return {
            ignored: files.filter(file => file.ignored),
            locked: files.filter(file => file.locked),
        }
    }, [files])

    const markedFilePathSets = useMemo(() => {
        return {
            ignored: new Set(markedFiles.ignored.map(file => file.path)),
            locked: new Set(markedFiles.locked.map(file => file.path)),
        }
    }, [markedFiles])

    const getMediaFiles = useCallback((mediaId: Nullish<number>) => {
        return files.filter(file => file.mediaId === mediaId) ?? []
    }, [files])

    /**
     * Lock file
     */
    const handleToggleMediaFileLocking = (mediaId: Nullish<number>) => {
        startTransition(() => {
            setFiles(files => {
                const concernedFiles = files.filter(file => file.mediaId === mediaId) ?? []
                const allFilesAreLocked = concernedFiles.every(n => n.locked)
                for (const file of concernedFiles) {
                    file.locked = !allFilesAreLocked
                }
                return
            })
        })
    }

    const handleToggleFileLocking = (path: string) => {
        startTransition(() => {
            setFiles(files => {
                const index = files.findIndex(file => file.path === path)
                if (index !== -1) files[index].locked = !files[index].locked
                return
            })
        })
    }

    const handleUnignoreFile = (path: string) => {
        startTransition(() => {
            setFiles(files => {
                const index = files.findIndex(file => file.path === path)
                if (index !== -1) files[index].ignored = false
                return
            })
        })
    }

    /**
     * Un-match file
     */
    const handleUnmatchFile = (path: string) => {
        startTransition(() => {
            setFiles(files => {
                const index = files.findIndex(file => file.path === path)
                if (index !== -1) {
                    files[index].mediaId = null
                    files[index].locked = false
                }
                return
            })
        })
    }

    return {
        localFiles: files,
        storeLocalFiles: handleStoreLocalFiles,
        setLocalFiles: setFiles,
        getMediaFiles: getMediaFiles,
        markedFiles,
        markedFilePathSets,
        unresolvedFileCount: useMemo(() => files.filter(file => !file.mediaId && !file.ignored).length, [files]),
        toggleFileLocking: handleToggleFileLocking,
        toggleMediaFileLocking: handleToggleMediaFileLocking,
        unmatchFile: handleUnmatchFile,
        unignoreFile: handleUnignoreFile,
    }

}
