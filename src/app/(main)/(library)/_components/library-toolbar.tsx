"use client"

import React from "react"
import { useSettings } from "@/atoms/settings"
import { Button } from "@/components/ui/button"
import { openLocalDirectoryInExplorer } from "@/lib/helpers/directory"
import { type } from "@tauri-apps/api/os"
import toast from "react-hot-toast"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"
import { retrieveLocalFilesAsLibraryEntries } from "@/lib/local-library/repository"
import { useLibraryEntries, useLockedAndIgnoredFilePaths, useStoredLocalFilesWithNoMatch } from "@/atoms/library"
import { useCurrentUser } from "@/atoms/user"
import { mock_getUniqueAnimeTitles } from "@/lib/local-library/experimental_unique-titles"
import { useStoredAnilistCollection } from "@/atoms/anilist-collection"
import { FcFinePrint } from "@react-icons/all-files/fc/FcFinePrint"
import { FcHighPriority } from "@react-icons/all-files/fc/FcHighPriority"
import { useDisclosure } from "@/hooks/use-disclosure"
import { ClassificationRecommendationHub } from "@/app/(main)/(library)/_components/classification-recommendation-hub"
import { LibraryEntry } from "@/lib/local-library/library-entry"

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

    const matchingRecommendationDisclosure = useDisclosure(false)

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
    }

    return (
        <>
            <div className={"p-4"}>
                <div className={"p-2 border border-[--border] rounded-lg flex w-full gap-2"}>

                    {/*TODO Show confirm modal*/}
                    <Button onClick={handleRefreshEntries} intent={"primary-subtle"} leftIcon={<FcFinePrint/>}>
                        Refresh entries
                    </Button>

                    {nbFilesWithNoMatch > 0 && <Button
                        onClick={async () => {
                            await getRecommendations()
                            matchingRecommendationDisclosure.open()
                        }}
                        intent={"alert-subtle"}
                        leftIcon={<FcHighPriority/>}
                        isDisabled={recommendationMatchingIsLoading}
                    >
                        Resolve unmatched ({nbFilesWithNoMatch})
                    </Button>}

                    <Button onClick={handleOpenLocalDirectory} intent={"gray-basic"} leftIcon={<BiFolder/>}>
                        Open folder
                    </Button>

                    <Button
                        onClick={async () => {
                            console.log((await mock_getUniqueAnimeTitles(settings, user?.name)))
                        }}
                        intent={"gray-basic"}
                    >Mock</Button>

                </div>
            </div>
            <ClassificationRecommendationHub
                isOpen={matchingRecommendationDisclosure.isOpen}
                close={matchingRecommendationDisclosure.close}
            />
        </>
    )

}
