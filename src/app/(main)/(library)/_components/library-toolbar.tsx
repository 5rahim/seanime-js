"use client"

import React, { useState } from "react"
import { useSettings } from "@/atoms/settings"
import { Button } from "@/components/ui/button"
import { openLocalDirectoryInExplorer } from "@/lib/helpers/directory"
import { type } from "@tauri-apps/api/os"
import toast from "react-hot-toast"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"
import { retrieveLocalFilesAsLibraryEntries } from "@/lib/local-library/repository"
import { useLibraryEntries, useLockedAndIgnoredFilePaths, useStoredLocalFilesWithNoMatch } from "@/atoms/library"
import { useCurrentUser } from "@/atoms/user"
import { useStoredAnilistCollection } from "@/atoms/anilist-collection"
import { FcHighPriority } from "@react-icons/all-files/fc/FcHighPriority"
import { useDisclosure } from "@/hooks/use-disclosure"
import { ClassificationRecommendationHub } from "@/app/(main)/(library)/_components/classification-recommendation-hub"
import { LibraryEntry } from "@/lib/local-library/library-entry"
import { Modal } from "@/components/ui/modal"
import { IoReload } from "@react-icons/all-files/io5/IoReload"
import { RiFolderDownloadFill } from "@react-icons/all-files/ri/RiFolderDownloadFill"
import { RiFileSearchLine } from "@react-icons/all-files/ri/RiFileSearchLine"
import { parseLocalFilesToLibraryEntry } from "@/lib/gpt/config"

export function LibraryToolbar() {

    const { settings } = useSettings()
    const { user } = useCurrentUser()

    const { lockedPaths, ignoredPaths } = useLockedAndIgnoredFilePaths()

    const { storeLibraryEntries } = useLibraryEntries()

    const {
        storeFilesWithNoMatch,
        nbFilesWithNoMatch,
        getRecommendations,
        recommendationMatchingIsLoading,
    } = useStoredLocalFilesWithNoMatch()

    const { refetchCollection } = useStoredAnilistCollection()

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

    // Create/update local library entries from scanned local files
    const handleRefreshEntries = async () => {
        const tID = toast.loading("Loading")
        setIsLoading(true)

        const result = await retrieveLocalFilesAsLibraryEntries(settings, user?.name, {
            ignored: ignoredPaths,
            locked: lockedPaths,
        })
        if (result) {
            storeLibraryEntries(prevEntries => {
                // Store the final merged entries
                const finalEntries: LibraryEntry[] = []
                // Create a Set of media IDs from the fetched entries for efficient lookup
                const fetchedEntriesMediaIds = new Set(result.entries.map(entry => entry.media.id))
                const processedMediaIds = new Set<number>()

                // Loop through previous entries so we can modify them
                for (const prevEntry of prevEntries) {
                    // Check if there's a fetched entry with the same media ID as the previous entry
                    if (fetchedEntriesMediaIds.has(prevEntry.media.id)) {
                        processedMediaIds.add(prevEntry.media.id)

                        const fetchedEntryWithSameMedia = result.entries.find(entry => entry.media.id === prevEntry.media.id)!
                        // Keep the locked files from the previous entry
                        const lockedFiles = prevEntry.files.filter(file => file.locked)
                        // Merge the fetched entry's files with locked files from the previous entry
                        finalEntries.push({
                            ...fetchedEntryWithSameMedia,
                            files: [...lockedFiles, ...fetchedEntryWithSameMedia.files],
                        })
                    } else {
                        finalEntries.push(prevEntry)
                    }
                }

                return [...finalEntries, ...result.entries.filter(entry => !processedMediaIds.has(entry.media.id))]
            })

            storeFilesWithNoMatch(prevFiles => {
                const fetchedFilesPaths = new Set(result.filesWithNoMatch.map(file => file.path))
                return [
                    // Keep previous files not in fetched files
                    ...prevFiles.filter(file => !fetchedFilesPaths.has(file.path)),
                    ...result.filesWithNoMatch,
                ]
            })
        }
        toast.success("Your local library is up to date")
        toast.remove(tID)
        setIsLoading(false)
    }
    const handleRescanEntries = async () => {
        const tID = toast.loading("Loading")
        setIsLoading(true)

        const result = await retrieveLocalFilesAsLibraryEntries(settings, user?.name, {
            ignored: [],
            locked: [],
        })
        if (result) {
            storeLibraryEntries(result.entries)
            storeFilesWithNoMatch(result.filesWithNoMatch)
        }
        toast.success("Your local library is up to date")
        toast.remove(tID)
        setIsLoading(false)
    }

    return (
        <>
            <div className={"p-4"}>
                <div className={"p-2 border border-[--border] rounded-lg flex w-full justify-between gap-2"}>

                    <div className={"inline-flex gap-2 items-center"}>
                        <Button onClick={refreshModal.open} intent={"primary-subtle"} leftIcon={<RiFileSearchLine/>}>
                            Refresh entries
                        </Button>

                        {nbFilesWithNoMatch > 0 && <Button
                            onClick={async () => {
                                await getRecommendations()
                                matchingRecommendationDisclosure.open()
                            }}
                            intent={"alert-subtle"}
                            leftIcon={<FcHighPriority/>}
                            isDisabled={recommendationMatchingIsLoading || isLoading}
                        >
                            Resolve unmatched ({nbFilesWithNoMatch})
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
            <ClassificationRecommendationHub
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
                <Button onClick={handleRefreshEntries} leftIcon={<IoReload/>} isDisabled={isLoading}>Refresh</Button>
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
