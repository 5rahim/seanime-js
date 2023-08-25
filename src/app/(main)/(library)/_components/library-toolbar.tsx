"use client"

import React, { useState } from "react"
import { useSettings } from "@/atoms/settings"
import { Button, IconButton } from "@/components/ui/button"
import { openLocalDirectoryInExplorer } from "@/lib/helpers/directory"
import { type } from "@tauri-apps/api/os"
import toast from "react-hot-toast"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"
import { cleanupFiles, scanLocalFiles } from "@/lib/local-library/repository"
import { useCurrentUser } from "@/atoms/user"
import { FcHighPriority } from "@react-icons/all-files/fc/FcHighPriority"
import { useDisclosure } from "@/hooks/use-disclosure"
import { ResolveUnmatched } from "@/app/(main)/(library)/_components/resolve-unmatched"
import { Modal } from "@/components/ui/modal"
import { IoReload } from "@react-icons/all-files/io5/IoReload"
import { RiFolderDownloadFill } from "@react-icons/all-files/ri/RiFolderDownloadFill"
import { RiFileSearchLine } from "@react-icons/all-files/ri/RiFileSearchLine"
import { useAuthed } from "@/atoms/auth"
import { useMatchingSuggestions } from "@/atoms/library/matching-suggestions.atoms"
import { localFilesAtom, useSetLocalFiles } from "@/atoms/library/local-file.atoms"
import { logger } from "@/lib/helpers/debug"
import { useSelectAtom } from "@/atoms/helpers"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { BiDotsVerticalRounded } from "@react-icons/all-files/bi/BiDotsVerticalRounded"

export function LibraryToolbar() {

    const { settings } = useSettings()
    const { user } = useCurrentUser()
    const { token } = useAuthed()

    const { getMatchingSuggestions, isLoading: recommendationLoading } = useMatchingSuggestions()
    const setLocalFiles = useSetLocalFiles()

    const unresolvedFileCount = useSelectAtom(localFilesAtom, files => files.filter(file => !file.mediaId && !file.ignored).length)
    const lockedPaths = useSelectAtom(localFilesAtom, files => files.filter(file => file.locked).map(file => file.path))
    const ignoredPaths = useSelectAtom(localFilesAtom, files => files.filter(file => file.ignored).map(file => file.path))

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

    const handleRefreshEntries = async () => {
        if (user && token) {
            const tID = toast.loading("Loading")
            setIsLoading(true)

            const result = await scanLocalFiles(settings, user?.name, token, {
                ignored: lockedPaths,
                locked: ignoredPaths,
            })
            if (result && result.checkedFiles && !result.error) {
                const incomingFiles = result.checkedFiles

                /**
                 * Refresh the local files by adding scanned files and keeping locked/ignored files intact
                 */
                setLocalFiles(draft => {
                    logger("atom/library/handleStoreLocalFiles").info("Incoming files", incomingFiles.length)
                    const keptFiles = draft.filter(file => file.ignored || file.locked)
                    const keptFilesPaths = new Set<string>(keptFiles.map(file => file.path))
                    return [...keptFiles, ...incomingFiles.filter(file => !keptFilesPaths.has(file.path))]
                })

                toast.success("Your local library is up to date")
            } else if (result && result.error) {
                toast.error(result.error)
            }
            toast.remove(tID)
            setIsLoading(false)
        }
    }

    const handleRescanEntries = async () => {
        if (user && token) {
            const tID = toast.loading("Loading")
            setIsLoading(true)

            const result = await scanLocalFiles(settings, user?.name, token, {
                ignored: [],
                locked: [],
            })
            if (result && result.checkedFiles) {
                if (result.checkedFiles.length > 0) {
                    setLocalFiles(result.checkedFiles)
                }
                toast.success("Your local library is up to date")
            } else if (result.error) {
                toast.error(result.error)
            }

            toast.remove(tID)
            setIsLoading(false)
        }
    }

    const handleCleanRepository = async () => {

        const { pathsToClean } = await cleanupFiles(settings, {
            ignored: lockedPaths,
            locked: ignoredPaths,
        })
        const pathsToCleanSet = new Set(pathsToClean)
        // Delete local files
        setLocalFiles(prev => {
            return prev.filter(file => !pathsToCleanSet.has(file.path))
        })

    }

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

                        <Button onClick={handleOpenLocalDirectory} intent={"gray-basic"} leftIcon={<BiFolder/>}>
                            Open folder
                        </Button>

                        <DropdownMenu trigger={<IconButton icon={<BiDotsVerticalRounded/>} intent={"gray-basic"}/>}>
                            <DropdownMenu.Item onClick={rescanModal.open}>
                                <RiFolderDownloadFill/>
                                <span>Re-scan library</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item>
                                <span>Manage ignored files</span>
                            </DropdownMenu.Item>
                        </DropdownMenu>
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
