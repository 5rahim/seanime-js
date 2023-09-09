"use client"

import React from "react"
import { useSettings } from "@/atoms/settings"
import { Button, IconButton } from "@/components/ui/button"
import { openLocalDirectoryInExplorer } from "@/lib/helpers/directory"
import { type } from "@tauri-apps/api/os"
import toast from "react-hot-toast"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"
import { FcHighPriority } from "@react-icons/all-files/fc/FcHighPriority"
import { useBoolean, useDisclosure } from "@/hooks/use-disclosure"
import { ResolveUnmatched } from "@/app/(main)/(library)/_containers/resolve-unmatched/resolve-unmatched"
import { Modal } from "@/components/ui/modal"
import { IoReload } from "@react-icons/all-files/io5/IoReload"
import { RiFolderDownloadFill } from "@react-icons/all-files/ri/RiFolderDownloadFill"
import { RiFileSearchLine } from "@react-icons/all-files/ri/RiFileSearchLine"
import { useMatchingSuggestions } from "@/atoms/library/matching-suggestions.atoms"
import { localFilesAtom } from "@/atoms/library/local-file.atoms"
import { useSelectAtom } from "@/atoms/helpers"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { BiDotsVerticalRounded } from "@react-icons/all-files/bi/BiDotsVerticalRounded"
import { FiSearch } from "@react-icons/all-files/fi/FiSearch"
import { GoDiffIgnored } from "@react-icons/all-files/go/GoDiffIgnored"
import { Checkbox } from "@/components/ui/checkbox"
import { useManageLibraryEntries } from "@/app/(main)/(library)/_containers/local-library/_lib/scan"

export function LibraryToolbar() {

    const { settings } = useSettings()

    const { getMatchingSuggestions, isLoading: recommendationLoading } = useMatchingSuggestions()

    const unresolvedFileCount = useSelectAtom(localFilesAtom, files => files.filter(file => !file.mediaId && !file.ignored).length)
    const lockedPaths = useSelectAtom(localFilesAtom, files => files.filter(file => file.locked).map(file => file.path))
    const ignoredPaths = useSelectAtom(localFilesAtom, files => files.filter(file => file.ignored).map(file => file.path))

    const resolveUnmatchedDrawer = useDisclosure(false)
    const refreshModal = useDisclosure(false)
    const rescanModal = useDisclosure(false)

    const rescan_preserveLockedFileStatus = useBoolean(true)
    const rescan_preserveIgnoredFileStatus = useBoolean(true)

    const handleOpenLocalDirectory = async () => {
        const tID = toast.loading("Opening")
        await openLocalDirectoryInExplorer(settings, await type())
        setTimeout(() => {
            toast.remove(tID)
        }, 1000)
    }

    const { handleRefreshEntries, handleRescanEntries, handleCleanRepository, isScanning } = useManageLibraryEntries({
        onComplete: () => {
            refreshModal.close()
            rescanModal.close()
        },
        preserveIgnoredFileStatus: rescan_preserveIgnoredFileStatus.active,
        preserveLockedFileStatus: rescan_preserveLockedFileStatus.active,
        lockedPaths,
        ignoredPaths,
    })


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
                                resolveUnmatchedDrawer.open()
                            }}
                            intent={"alert-subtle"}
                            leftIcon={<FcHighPriority/>}
                            isDisabled={recommendationLoading || isScanning}
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
                            <DropdownMenu.Link href={"/manage-ignored"}>
                                <GoDiffIgnored/>
                                <span>Manage ignored files</span>
                            </DropdownMenu.Link>
                        </DropdownMenu>
                    </div>

                </div>
            </div>


            <ResolveUnmatched
                isOpen={resolveUnmatchedDrawer.isOpen}
                close={resolveUnmatchedDrawer.close}
            />

            <Modal
                isOpen={refreshModal.isOpen}
                onClose={refreshModal.close}
                isClosable
                title={"Refresh entries"}
                bodyClassName={"space-y-4"}
            >

                <p>Are you sure you want to refresh entries?</p>

                <div>
                    {/*<Checkbox label={"Skip locked files"} checked={refresh_skipLockedFiles.active} onChange={refresh_skipLockedFiles.toggle} />*/}
                    <Checkbox label={"Clean up non-existent files"} checked={true} isDisabled/>
                </div>

                <Button
                    onClick={async () => {
                        await handleRefreshEntries()
                        await handleCleanRepository()
                    }}
                    leftIcon={<IoReload/>}
                    isDisabled={isScanning}
                >
                    Refresh
                </Button>

            </Modal>

            <Modal isOpen={rescanModal.isOpen} onClose={rescanModal.close} isClosable title={"Scan library"}
                   bodyClassName={"space-y-4"}>
                <div>
                    <Checkbox
                        label={"Preserve locked status"}
                        checked={rescan_preserveLockedFileStatus.active}
                        onChange={rescan_preserveLockedFileStatus.toggle}
                    />
                    <Checkbox
                        label={"Preserve ignored status"}
                        checked={rescan_preserveIgnoredFileStatus.active}
                        onChange={rescan_preserveIgnoredFileStatus.toggle}
                    />
                </div>
                <Button
                    onClick={handleRescanEntries}
                    intent={"warning"}
                    leftIcon={<IoReload/>}
                    isDisabled={isScanning}
                >
                    Re-scan
                </Button>
            </Modal>
        </>
    )

}
