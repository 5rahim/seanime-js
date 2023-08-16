"use client"

import React from "react"
import { useSettings } from "@/atoms/settings"
import { Button } from "@/components/ui/button"
import { openLocalDirectoryInExplorer } from "@/lib/helpers/directory"
import { type } from "@tauri-apps/api/os"
import toast from "react-hot-toast"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"
import { retrieveLocalFilesAsLibraryEntries } from "@/lib/local-library/repository"
import { useLibraryEntries, useStoredLocalFiles, useStoredLocalFilesWithNoMatch } from "@/atoms/library"
import { useCurrentUser } from "@/atoms/user"
import { mock_getUniqueAnimeTitles } from "@/lib/local-library/experimental_unique-titles"
import { useStoredAnilistCollection } from "@/atoms/anilist-collection"
import { FcFinePrint } from "@react-icons/all-files/fc/FcFinePrint"
import { FcHighPriority } from "@react-icons/all-files/fc/FcHighPriority"
import { useDisclosure } from "@/hooks/use-disclosure"
import { ClassificationRecommendationHub } from "@/app/(main)/(library)/_components/classification-recommendation-hub"

export function LibraryToolbar() {

    const { settings } = useSettings()
    const { user } = useCurrentUser()
    const { storeLocalFiles } = useStoredLocalFiles()
    const { storeLibraryEntries } = useLibraryEntries()
    const { storeFilesWithNoMatch, files } = useStoredLocalFilesWithNoMatch()
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
        // TODO: Invoke [handleScanLibrary]
        const result = await retrieveLocalFilesAsLibraryEntries(settings, user?.name)
        if (result) {
            storeLibraryEntries(result.entries)
            storeFilesWithNoMatch(result.filesWithNoMatch)
        }
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
                    <Button onClick={matchingRecommendationDisclosure.open} intent={"alert-subtle"}
                            leftIcon={<FcHighPriority/>}>
                        Resolve unmatched ({files.length})
                    </Button>
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
