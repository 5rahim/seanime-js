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
            storeLibraryEntries(entries => {
                let newEntries: LibraryEntry[] = []
                let resultEntries = structuredClone(result.entries)
                entries.map(existingEntry => {
                    const resultEntryWithSameMedia = result.entries.find(entry => entry.media.id === existingEntry.media.id)
                    // If an entry already exists with that media
                    if (resultEntryWithSameMedia) {
                        resultEntries = resultEntries.filter(n => n.media.id !== resultEntryWithSameMedia.media.id)
                        newEntries = [...newEntries, {
                            ...resultEntryWithSameMedia,
                            files: [
                                ...existingEntry.files.filter(n => n.locked), // Keep the locked files of the existing entry
                                ...resultEntryWithSameMedia.files,
                            ],
                        }]
                    } else {
                        // If not just add the existing entry
                        newEntries = [...newEntries, existingEntry]
                    }
                })
                return [...newEntries, ...resultEntries]
            })
            storeFilesWithNoMatch(files => {
                return [
                    ...files.filter(file => !result.filesWithNoMatch.map(n => n.path).includes(file.path)),
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
