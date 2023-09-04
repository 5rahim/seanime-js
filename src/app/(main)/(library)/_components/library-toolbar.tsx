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
import { useBoolean, useDisclosure } from "@/hooks/use-disclosure"
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
import { FiSearch } from "@react-icons/all-files/fi/FiSearch"
import { GoDiffIgnored } from "@react-icons/all-files/go/GoDiffIgnored"
import { Checkbox } from "@/components/ui/checkbox"

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

    const refresh_skipLockedFiles = useBoolean(false)
    const rescan_preserveLockedFileStatus = useBoolean(true)
    const rescan_preserveIgnoredFileStatus = useBoolean(true)

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
                locked: lockedPaths,
                ignored: ignoredPaths,
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
            refreshModal.close()
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

                    if (rescan_preserveLockedFileStatus.active || rescan_preserveIgnoredFileStatus.active) {
                        setLocalFiles(draft => {
                            const lockedPathsSet = new Set(draft.filter(file => !!file.locked).map(file => file.path))
                            const ignoredPathsSet = new Set(draft.filter(file => !!file.ignored).map(file => file.path))
                            const final = []
                            for (let i = 0; i < result.checkedFiles.length; i++) {
                                if (rescan_preserveLockedFileStatus.active && lockedPathsSet.has(result.checkedFiles[i].path)) { // Reset locked status
                                    result.checkedFiles[i].locked = true
                                }
                                if (rescan_preserveIgnoredFileStatus.active && ignoredPathsSet.has(result.checkedFiles[i].path)) { // Reset ignored status
                                    result.checkedFiles[i].ignored = true
                                }
                                final.push(result.checkedFiles[i])
                            }
                            return final
                        })
                    } else {
                        setLocalFiles(result.checkedFiles)
                    }
                }
                toast.success("Your local library is up to date")
            } else if (result.error) {
                toast.error(result.error)
            }
            rescanModal.close()
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
                <div className={"flex w-full justify-between gap-2"}>

                    <div className={"inline-flex gap-2 items-center"}>
                        {(lockedPaths.length > 0 || ignoredPaths.length > 0) ?
                            <Button onClick={refreshModal.open} intent={"primary-subtle"}
                                    leftIcon={<RiFileSearchLine/>}>
                                Refresh entries
                            </Button> : <Button onClick={handleRescanEntries} intent={"primary"} leftIcon={<FiSearch/>}>
                                Scan library
                            </Button>}

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

                        <DropdownMenu trigger={<IconButton icon={<BiDotsVerticalRounded/>} intent={"gray-basic"}/>}>
                            <DropdownMenu.Item onClick={handleOpenLocalDirectory}>
                                <BiFolder/>
                                <span>Open folder</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item onClick={rescanModal.open}>
                                <RiFolderDownloadFill/>
                                <span>Re-scan library</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item>
                                <GoDiffIgnored/>
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

                <div>
                    {/*<Checkbox label={"Skip locked files"} checked={refresh_skipLockedFiles.active} onChange={refresh_skipLockedFiles.toggle} />*/}
                    <Checkbox label={"Clean up non-existent files"} checked={true} isDisabled/>
                </div>

                <Button onClick={async () => {
                    await handleRefreshEntries()
                    await handleCleanRepository()
                }} leftIcon={<IoReload/>} isDisabled={isLoading}>Refresh</Button>

            </Modal>
            <Modal isOpen={rescanModal.isOpen} onClose={rescanModal.close} isClosable title={"Scan library"}
                   bodyClassName={"space-y-4"}>
                <div>
                    <Checkbox label={"Preserve locked status"} checked={rescan_preserveLockedFileStatus.active}
                              onChange={rescan_preserveLockedFileStatus.toggle}/>
                    <Checkbox label={"Preserve ignored status"} checked={rescan_preserveIgnoredFileStatus.active}
                              onChange={rescan_preserveIgnoredFileStatus.toggle}/>
                </div>
                <Button onClick={handleRescanEntries} intent={"warning"} leftIcon={<IoReload/>}
                        isDisabled={isLoading}>Re-scan</Button>
            </Modal>
        </>
    )

}
