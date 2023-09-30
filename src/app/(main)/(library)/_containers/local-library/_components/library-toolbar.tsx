"use client"

import React, { useCallback } from "react"
import { useSettings } from "@/atoms/settings"
import { Button, IconButton } from "@/components/ui/button"
import { openLocalDirectoryInExplorer } from "@/lib/helpers/directory"
import toast from "react-hot-toast"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"
import { FcHighPriority } from "@react-icons/all-files/fc/FcHighPriority"
import { useBoolean, useDisclosure } from "@/hooks/use-disclosure"
import { ResolveUnmatched } from "@/app/(main)/(library)/_containers/resolve-unmatched/resolve-unmatched"
import { Modal } from "@/components/ui/modal"
import { IoReload } from "@react-icons/all-files/io5/IoReload"
import { RiFolderDownloadFill } from "@react-icons/all-files/ri/RiFolderDownloadFill"
import { useMatchingSuggestions } from "@/atoms/library/matching-suggestions.atoms"
import { localFilesAtom } from "@/atoms/library/local-file.atoms"
import { useSelectAtom } from "@/atoms/helpers"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { BiDotsVerticalRounded } from "@react-icons/all-files/bi/BiDotsVerticalRounded"
import { GoDiffIgnored } from "@react-icons/all-files/go/GoDiffIgnored"
import { Checkbox } from "@/components/ui/checkbox"
import { useManageLibraryEntries } from "@/app/(main)/(library)/_containers/local-library/_lib/scan"
import { useSetAtom } from "jotai/react"
import { __ignoredFilesDrawerIsOpenAtom } from "@/app/(main)/(library)/_containers/ignored-files/ignored-files-drawer"
import { BiCollection } from "@react-icons/all-files/bi/BiCollection"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { BiLockAlt } from "@react-icons/all-files/bi/BiLockAlt"
import { BiLockOpenAlt } from "@react-icons/all-files/bi/BiLockOpenAlt"
import { HiSparkles } from "@react-icons/all-files/hi/HiSparkles"
import { Divider } from "@/components/ui/divider"
import { BetaBadge } from "@/components/application/beta-badge"
import { FiSearch } from "@react-icons/all-files/fi/FiSearch"
import { HiOutlineSparkles } from "@react-icons/all-files/hi/HiOutlineSparkles"

export function LibraryToolbar() {

    const { settings } = useSettings()
    const setOpenIgnoredFilesDrawer = useSetAtom(__ignoredFilesDrawerIsOpenAtom)

    const { getMatchingSuggestions, isLoading: recommendationLoading } = useMatchingSuggestions()

    const localFileCount = useSelectAtom(localFilesAtom, files => files.length)
    const unresolvedFileCount = useSelectAtom(localFilesAtom, files => files.filter(file => !file.mediaId && !file.ignored).length)

    const resolveUnmatchedDrawer = useDisclosure(false)
    const refreshModal = useDisclosure(false)
    const scanModal = useDisclosure(false)
    const bulkActionModal = useDisclosure(false)

    const scan_enhancedScanning = useBoolean(false)
    const scan_preserveLockedFileStatus = useBoolean(true)
    const scan_preserveIgnoredFileStatus = useBoolean(true)

    const {
        handleRefreshEntries,
        handleRescanEntries,
        handleCheckRepository,
        handleLockAllFiles,
        handleUnlockAllFiles,
        lockedPaths,
        ignoredPaths,
        isScanning,
    } = useManageLibraryEntries({
        onComplete: () => {
            refreshModal.close()
            scanModal.close()
        },
        scanOptions: {
            preserveIgnoredFileStatus: scan_preserveIgnoredFileStatus.active,
            preserveLockedFileStatus: scan_preserveLockedFileStatus.active,
            enhancedScanning: scan_enhancedScanning.active,
        },
    })

    const handleOpenLocalDirectory = async () => {
        const tID = toast.loading("Opening")
        await openLocalDirectoryInExplorer(settings)
        setTimeout(() => {
            toast.remove(tID)
        }, 1000)
    }

    async function onRefreshButtonClick() {
        await handleRefreshEntries()
        await handleCheckRepository()
    }

    async function onLockAllFiles() {
        await handleLockAllFiles()
        bulkActionModal.close()
    }

    async function onUnlockAllFiles() {
        await handleUnlockAllFiles()
        bulkActionModal.close()
    }

    const EnhancedScanUl = useCallback(() => (
        <ul className={"list-disc pl-14"}>
            <li><strong>Your anime files and folders should all be located at the root</strong>
                <ul className={"list-disc pl-8 text-[--muted]"}>
                    <li>Avoid grouping folders such as "Movies, …" at the root</li>
                </ul>
            </li>
            <li>Your Anilist watch list data is <strong>not needed</strong></li>
            <li>This feature might be less accurate for detecting movies and specials</li>
            <li>It <strong>will</strong> slow down scanning</li>
        </ul>
    ), [])


    return (
        <>
            <div className={"p-4"}>
                <div className={"flex w-full justify-between gap-2"}>

                    <div className={"inline-flex gap-2 items-center"}>
                        {(localFileCount > 0) ? <>
                            <Button onClick={refreshModal.open} intent={"primary-subtle"}
                                    leftIcon={<FiSearch/>}
                            >
                                Refresh entries
                            </Button>
                        </> : <>
                            <Button onClick={scanModal.open} intent={"primary-outline"} leftIcon={<HiSparkles/>}>
                                Scan your library
                            </Button>
                        </>}


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
                            <DropdownMenu.Item onClick={scanModal.open}>
                                <RiFolderDownloadFill/>
                                <span>Scan library</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item onClick={() => setOpenIgnoredFilesDrawer(true)}>
                                <GoDiffIgnored/>
                                <span>Manage ignored files</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item onClick={bulkActionModal.open}>
                                <BiCollection/>
                                <span>Bulk actions</span>
                            </DropdownMenu.Item>
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
                title={<h3>Refresh entries</h3>}
                titleClassName={"text-center"}
                bodyClassName={"space-y-4"}
                size={"xl"}
            >

                <div className={"space-y-4 mt-6"}>
                    <div>
                        <Checkbox
                            label={<span className={"flex items-center"}>Enable enhanced refreshing <BetaBadge/>
                                <HiOutlineSparkles className={"ml-2 text-amber-500"}/></span>}
                            checked={scan_enhancedScanning.active}
                            onChange={scan_enhancedScanning.toggle}
                            controlClassName={"data-[state=checked]:bg-amber-700 dark:data-[state=checked]:bg-amber-700"}
                            size={"lg"}
                        />

                        {scan_enhancedScanning.active && <EnhancedScanUl/>}
                        <ul className={"list-disc pl-14 text-[--muted]"}>
                            <li>(?) Better detection for media not present your AniList watch list</li>
                        </ul>
                    </div>

                    <Divider/>

                    <Checkbox label={"Clean up non-existent files"} checked={true} isDisabled/>
                    {/*<Checkbox label={"Did you add new media?"} checked={false}/>*/}
                </div>

                <Button
                    onClick={onRefreshButtonClick}
                    leftIcon={<IoReload/>}
                    isDisabled={isScanning}
                    className={"w-full"}
                >
                    Refresh
                </Button>

            </Modal>

            <Modal
                isOpen={scanModal.isOpen}
                onClose={scanModal.close}
                isClosable
                title={<h3>Scan library</h3>}
                titleClassName={"text-center"}
                bodyClassName={"space-y-4"}
                size={"xl"}
            >
                <div className={"space-y-4 mt-6"}>

                    <div>
                        <Checkbox
                            label={<span className={"flex items-center"}>Enable enhanced scanning <BetaBadge/>
                                <HiOutlineSparkles className={"ml-2 text-amber-500"}/></span>}
                            checked={scan_enhancedScanning.active}
                            onChange={scan_enhancedScanning.toggle}
                            controlClassName={"data-[state=checked]:bg-amber-700 dark:data-[state=checked]:bg-amber-700"}
                            size={"lg"}
                        />

                        {scan_enhancedScanning.active && <EnhancedScanUl/>}
                    </div>

                    <Divider/>

                    <div className={"space-y-2"}>
                        <Checkbox
                            label={"Preserve locked status"}
                            checked={lockedPaths.length === 0 ? false : scan_preserveLockedFileStatus.active}
                            onChange={scan_preserveLockedFileStatus.toggle}
                            isDisabled={lockedPaths.length === 0}
                            size={"lg"}
                        />
                        <Checkbox
                            label={"Preserve ignored status"}
                            checked={ignoredPaths.length === 0 ? false : scan_preserveIgnoredFileStatus.active}
                            onChange={scan_preserveIgnoredFileStatus.toggle}
                            isDisabled={ignoredPaths.length === 0}
                            size={"lg"}
                        />
                    </div>
                </div>
                <Button
                    onClick={handleRescanEntries}
                    intent={"primary"}
                    leftIcon={<FiSearch/>}
                    isDisabled={isScanning}
                    className={"w-full"}
                >
                    Scan
                </Button>
            </Modal>

            <Modal isOpen={bulkActionModal.isOpen} onClose={bulkActionModal.close} isClosable title={"Bulk actions"}
                   bodyClassName={"space-y-4"}>
                <AppLayoutStack spacing={"sm"}>
                    <p>These actions do not affect ignored files.</p>
                    <Button
                        leftIcon={<BiLockAlt/>}
                        intent={"white-subtle"}
                        className={"w-full"}
                        onClick={onLockAllFiles}
                    >
                        Lock all files
                    </Button>
                    <Button
                        leftIcon={<BiLockOpenAlt/>}
                        intent={"white-subtle"}
                        className={"w-full"}
                        onClick={onUnlockAllFiles}
                    >
                        Unlock all files
                    </Button>
                </AppLayoutStack>
            </Modal>
        </>
    )

}
