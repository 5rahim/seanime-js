import toast from "react-hot-toast"
import { checkLocalFiles } from "@/lib/local-library/repository"
import { logger } from "@/lib/helpers/debug"
import { useCallback, useState } from "react"
import { useAuthed } from "@/atoms/auth"
import { useCurrentUser } from "@/atoms/user"
import { localFilesAtom, useSetLocalFiles } from "@/atoms/library/local-file.atoms"
import { useSettings } from "@/atoms/settings"
import { useSelectAtom } from "@/atoms/helpers"
import { scanLocalFiles } from "@/lib/local-library/scan"
import { useRefreshAnilistCollection } from "@/atoms/anilist/collection.atoms"

type UseManageEntriesOptions = {
    onComplete: () => void
    scanOptions?: {
        preserveLockedFileStatus?: boolean
        preserveIgnoredFileStatus?: boolean
        enhancedScanning?: boolean
    }
}

export function useManageLibraryEntries(opts: UseManageEntriesOptions) {

    const { token } = useAuthed()
    const { user } = useCurrentUser()
    const { settings } = useSettings()

    const lockedPaths = useSelectAtom(localFilesAtom, files => files.filter(file => file.locked).map(file => file.path))
    const ignoredPaths = useSelectAtom(localFilesAtom, files => files.filter(file => file.ignored).map(file => file.path))
    const refreshCollection = useRefreshAnilistCollection()

    const [isLoading, setIsLoading] = useState(false)

    // Atoms
    const setLocalFiles = useSetLocalFiles()

    const handleRefreshEntries = useCallback(async () => {
        if (user && token) {
            const tID = toast.loading("Loading")
            setIsLoading(true)

            const result = await scanLocalFiles({
                settings,
                userName: user?.name,
                token,
                markedPaths: {
                    locked: lockedPaths,
                    ignored: ignoredPaths,
                },
                enhanced: opts.scanOptions?.enhancedScanning ? "partial" : "none",
            })

            if (result && result.scannedFiles && !result.error) {
                const incomingFiles = result.scannedFiles

                /**
                 * Refresh the local files by adding scanned files and keeping locked/ignored files intact
                 */
                setLocalFiles(draft => {
                    logger("atom/library/handleStoreLocalFiles").info("Incoming files", incomingFiles.length)
                    const keptFiles = draft.filter(file => file.ignored || file.locked)
                    const keptFilesPaths = new Set<string>(keptFiles.map(file => file.path))
                    return [...keptFiles, ...incomingFiles.filter(file => !keptFilesPaths.has(file.path))]
                })

                // Refresh collection
                setTimeout(() => {
                    refreshCollection({ muteAlert: true })
                }, 1000)

                toast.success("Your local library is up to date")
            } else if (result && result.error) {
                toast.error(result.error)
            }

            opts.onComplete()
            toast.remove(tID)
            setIsLoading(false)
        } else {
            unauthenticatedAlert()
        }
    }, [user, token, settings, lockedPaths, ignoredPaths, opts.scanOptions?.enhancedScanning])


    const handleRescanEntries = useCallback(async () => {
        if (user && token) {
            const tID = toast.loading("Loading")
            setIsLoading(true)

            const result = await scanLocalFiles({
                settings,
                userName: user?.name,
                token,
                markedPaths: {
                    ignored: [],
                    locked: [],
                },
                enhanced: opts.scanOptions?.enhancedScanning ? "full" : "none",
            })
            if (result && result.scannedFiles) {
                if (result.scannedFiles.length > 0) {

                    if (opts.scanOptions?.preserveLockedFileStatus || opts.scanOptions?.preserveIgnoredFileStatus) {
                        setLocalFiles(draft => {
                            const lockedPathsSet = new Set(draft.filter(file => !!file.locked).map(file => file.path))
                            const ignoredPathsSet = new Set(draft.filter(file => !!file.ignored).map(file => file.path))
                            const final = []
                            for (let i = 0; i < result.scannedFiles.length; i++) {
                                if (opts.scanOptions?.preserveLockedFileStatus && lockedPathsSet.has(result.scannedFiles[i].path)) { // Reset locked status
                                    result.scannedFiles[i].locked = true
                                }
                                if (opts.scanOptions?.preserveIgnoredFileStatus && ignoredPathsSet.has(result.scannedFiles[i].path)) { // Reset ignored status
                                    result.scannedFiles[i].ignored = true
                                }
                                final.push(result.scannedFiles[i])
                            }
                            return final
                        })
                    } else {
                        setLocalFiles(result.scannedFiles)
                    }

                    // Refresh collection
                    setTimeout(() => {
                        refreshCollection({ muteAlert: true })
                    }, 1000)
                }
                toast.success("Your local library is up to date")
            } else if (result.error) {
                toast.error(result.error)
            }
            opts.onComplete
            toast.remove(tID)
            setIsLoading(false)
        } else {
            unauthenticatedAlert()
        }
    }, [user, token, settings, lockedPaths, ignoredPaths, opts.scanOptions?.preserveLockedFileStatus, opts.scanOptions?.preserveIgnoredFileStatus, opts.scanOptions?.enhancedScanning])


    const handleCheckRepository = useCallback(async () => {

        if (user && token) {
            const { pathsToClean } = await checkLocalFiles(settings, {
                ignored: lockedPaths,
                locked: ignoredPaths,
            })
            const pathsToCleanSet = new Set(pathsToClean)
            // Delete local files
            setLocalFiles(prev => {
                return prev.filter(file => !pathsToCleanSet.has(file.path))
            })
        }

    }, [lockedPaths, ignoredPaths, user, token])

    const handleLockAllFiles = useCallback(async () => {
        setLocalFiles(prev => {
            for (const file of prev) {
                if (!file.ignored && !file.locked) {
                    file.locked = true
                }
            }
            return
        })
        toast.success("All files are locked")

    }, [])

    const handleUnlockAllFiles = useCallback(async () => {
        setLocalFiles(prev => {
            for (const file of prev) {
                if (!file.ignored && file.locked) {
                    file.locked = false
                }
            }
            return
        })
        toast.success("All files are unlocked")

    }, [])

    return {
        handleRescanEntries,
        handleRefreshEntries,
        handleCheckRepository,
        handleLockAllFiles,
        handleUnlockAllFiles,
        isScanning: isLoading,
        lockedPaths,
        ignoredPaths,
    }

    function unauthenticatedAlert() {
        toast.error("You need to be authenticated to perform this action")
    }

}
