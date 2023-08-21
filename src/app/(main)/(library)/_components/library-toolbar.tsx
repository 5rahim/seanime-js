"use client"

import React, { useCallback, useState } from "react"
import { useSettings } from "@/atoms/settings"
import { Button } from "@/components/ui/button"
import { openLocalDirectoryInExplorer } from "@/lib/helpers/directory"
import { type } from "@tauri-apps/api/os"
import toast from "react-hot-toast"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"
import { cleanupFiles, retrieveLocalFilesAsLibraryEntries } from "@/lib/local-library/repository"
import { useCurrentUser } from "@/atoms/user"
import { FcHighPriority } from "@react-icons/all-files/fc/FcHighPriority"
import { useDisclosure } from "@/hooks/use-disclosure"
import { ResolveUnmatched } from "@/app/(main)/(library)/_components/resolve-unmatched"
import { Modal } from "@/components/ui/modal"
import { IoReload } from "@react-icons/all-files/io5/IoReload"
import { RiFolderDownloadFill } from "@react-icons/all-files/ri/RiFolderDownloadFill"
import { RiFileSearchLine } from "@react-icons/all-files/ri/RiFileSearchLine"
import { parseLocalFilesToLibraryEntry } from "@/lib/gpt/config"
import { useAuthed } from "@/atoms/auth"
import { useMatchingSuggestions } from "@/atoms/library/matching-suggestions.atoms"

import { legacy_useLibraryEntries } from "@/atoms/library/library-entry.atoms"
import { useStoredLocalFiles } from "@/atoms/library/local-file.atoms"

/**
 * TODO: Refactor
 * @constructor
 */

export function LibraryToolbar() {

    const { settings } = useSettings()
    const { user } = useCurrentUser()
    const { token } = useAuthed()

    const { actualizeEntries, setEntries } = legacy_useLibraryEntries()
    const { storeLocalFiles, setLocalFiles, markedFilePathSets, unresolvedFileCount } = useStoredLocalFiles()
    const { getMatchingSuggestions, isLoading: recommendationLoading } = useMatchingSuggestions()

    const [isLoading, setIsLoading] = useState(false)

    const matchingRecommendationDisclosure = useDisclosure(false)
    const refreshModal = useDisclosure(false)
    const rescanModal = useDisclosure(false)

    const handleOpenLocalDirectory = async () => {
        const tID = toast.loading("Opening")
        await openLocalDirectoryInExplorer(settings, await type())
        setTimeout(() => {
            toast.remove(tID)
        }, 1000)
    }

    /**
     * Calls [storeLocalFiles] to actualize files (preserves locked and ignored files and overwrites/adds with incoming files)
     */
    const handleRefreshEntries = useCallback(async () => {
        if (user && token) {
            const tID = toast.loading("Loading")
            setIsLoading(true)

            const result = await retrieveLocalFilesAsLibraryEntries(settings, user?.name, token, {
                ignored: Array.from(markedFilePathSets.ignored),
                locked: Array.from(markedFilePathSets.locked),
            })
            if (result) {

                storeLocalFiles(result.checkedFiles)
                actualizeEntries(result.entries)

            }
            toast.success("Your local library is up to date")
            toast.remove(tID)
            setIsLoading(false)
        }
    }, [settings, user, token, markedFilePathSets])

    const handleRescanEntries = useCallback(async () => {
        if (user && token) {
            const tID = toast.loading("Loading")
            setIsLoading(true)

            const result = await retrieveLocalFilesAsLibraryEntries(settings, user?.name, token, {
                ignored: [],
                locked: [],
            })
            if (result) {
                setLocalFiles(draft => {
                    return result.checkedFiles
                })
                setEntries(draft => {
                    return result.entries
                })
            }
            toast.success("Your local library is up to date")
            toast.remove(tID)
            setIsLoading(false)
        }
    }, [settings, user, token, markedFilePathSets])

    const handleCleanRepository = useCallback(async () => {
        const { ignoredPathsToClean, lockedPathsToClean } = await cleanupFiles(settings, {
            ignored: Array.from(markedFilePathSets.ignored),
            locked: Array.from(markedFilePathSets.locked),
        })

        const ignoredPathsToCleanSet = new Set(ignoredPathsToClean)
        const lockedPathsToCleanSet = new Set(lockedPathsToClean)

        // Delete local files, this will trigger libraryEntries to delete the paths too
        setLocalFiles(files => {
            return files.filter(file => !ignoredPathsToCleanSet.has(file.path) && !lockedPathsToCleanSet.has(file.path))
        })

    }, [settings])

    return (
        <>
            <div className={"p-4"}>
                <div className={"p-2 border border-[--border] rounded-lg flex w-full justify-between gap-2"}>

                    <div className={"inline-flex gap-2 items-center"}>
                        <Button onClick={refreshModal.open} intent={"primary-subtle"} leftIcon={<RiFileSearchLine/>}>
                            Refresh entries
                        </Button>

                        {unresolvedFileCount > 0 && <Button
                            onClick={async () => {
                                await getMatchingSuggestions("folder")
                                matchingRecommendationDisclosure.open()
                            }}
                            intent={"alert-subtle"}
                            leftIcon={<FcHighPriority/>}
                            isDisabled={recommendationLoading || isLoading}
                        >
                            Resolve unmatched ({unresolvedFileCount})
                        </Button>}
                    </div>

                    <div className={"inline-flex gap-2 items-center"}>
                        <Button onClick={rescanModal.open} intent={"warning-subtle"} leftIcon={<RiFolderDownloadFill/>}>
                            Re-scan library
                        </Button>

                        <Button onClick={handleOpenLocalDirectory} intent={"gray-basic"} leftIcon={<BiFolder/>}>
                            Open folder
                        </Button>

                        <Button
                            onClick={async () => {
                                console.log((await parseLocalFilesToLibraryEntry()))
                            }}
                            intent={"gray-basic"}
                        >Mock</Button>
                    </div>

                </div>
            </div>
            <ResolveUnmatched
                isOpen={matchingRecommendationDisclosure.isOpen}
                close={matchingRecommendationDisclosure.close}
            />
            <Modal isOpen={refreshModal.isOpen} onClose={refreshModal.close} isClosable title={"Refresh entries"}
                   bodyClassName={"space-y-4"}>
                <p>Are you sure you want to refresh entries?</p>
                <ul className={"list-disc pl-4"}>
                    <li>You have locked or ignored files using Seanime</li>
                    <li>You have NOT manually modified, added, deleted, moved files or folders</li>
                </ul>
                <Button onClick={async () => {
                    await handleRefreshEntries()
                    await handleCleanRepository()
                }} leftIcon={<IoReload/>} isDisabled={isLoading}>Refresh</Button>
            </Modal>
            <Modal isOpen={rescanModal.isOpen} onClose={rescanModal.close} isClosable title={"Re-scan library"}
                   bodyClassName={"space-y-4"}>
                <p>Are you sure you want to re-scan your library?</p>
                <ul className={"list-disc pl-4"}>
                    <li>This will un-match locked or ignored files</li>
                </ul>
                <Button onClick={handleRescanEntries} intent={"warning"} leftIcon={<IoReload/>}
                        isDisabled={isLoading}>Re-scan</Button>
            </Modal>
        </>
    )

}
