"use client"
import React, { startTransition } from "react"
import { atom, PrimitiveAtom } from "jotai"
import { Drawer } from "@/components/ui/modal"
import { useAtom, useAtomValue } from "jotai/react"
import {
    __useListenToLocalFiles,
    __useRerenderLocalFiles,
    ignoredLocalFileAtomsAtom,
} from "@/atoms/library/local-file.atoms"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { useFocusSetAtom, useSelectAtom } from "@/atoms/helpers"
import { Tooltip } from "@/components/ui/tooltip"
import { IconButton } from "@/components/ui/button"
import { BiCollection } from "@react-icons/all-files/bi/BiCollection"
import { FcFile } from "@react-icons/all-files/fc/FcFile"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"
import { openDirectoryInExplorer } from "@/lib/helpers/directory"
import { LuffyError } from "@/components/shared/luffy-error"
import { LocalFile } from "@/lib/local-library/types"

export const __ignoredFilesDrawerIsOpenAtom = atom(false)

interface IgnoredFilesDrawerProps {
    children?: React.ReactNode
}

export const IgnoredFilesDrawer: React.FC<IgnoredFilesDrawerProps> = (props) => {

    const { children, ...rest } = props
    const [isOpen, setIsOpen] = useAtom(__ignoredFilesDrawerIsOpenAtom)
    const __ = __useListenToLocalFiles()

    const ignoredLocalFileAtoms = useAtomValue(ignoredLocalFileAtomsAtom)

    return (
        <Drawer
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title={"Ignored files"}
            size={"2xl"}
            headerClassName={"pt-10 sm:pt-10"}
            isClosable
        >
            <AppLayoutStack className={"divide-y divide-[--border] pb-10"}>
                {ignoredLocalFileAtoms.map(fileAtom => {
                    return <Item key={`${fileAtom}`} fileAtom={fileAtom}/>
                })}
                {ignoredLocalFileAtoms.length === 0 && (
                    <LuffyError title={null}>No ignored files</LuffyError>
                )}
            </AppLayoutStack>
        </Drawer>
    )

}

type Props = {
    fileAtom: PrimitiveAtom<LocalFile>
}

export function Item(props: Props) {

    const { fileAtom } = props
    const path = useSelectAtom(fileAtom, file => file.path)
    const name = useSelectAtom(fileAtom, file => file.name)
    const setIgnored = useFocusSetAtom(fileAtom, "ignored")
    const rerenderFiles = __useRerenderLocalFiles()

    return (
        <div className={"pt-4 flex w-full justify-between gap-4 items-center"}>
            <div>
                <div className={"flex items-center gap-2"}>
                    <FcFile className={"flex-none"}/>
                    <p className={"font-semibold line-clamp-1"}>
                        {name}
                    </p>
                </div>
                <p className={"text-[--muted] text-sm line-clamp-1"}>
                    {path}
                </p>
            </div>
            <div className={"flex flex-none items-center gap-2"}>
                <Tooltip trigger={
                    <div className={"flex-none"}>
                        <IconButton
                            icon={<BiFolder/>}
                            size={"sm"}
                            intent={"gray-subtle"}
                            className={"flex-none"}
                            onClick={async () => {
                                openDirectoryInExplorer(path.replace(name, ""))
                            }}
                        />
                    </div>
                }>
                    Open directory
                </Tooltip>
                <Tooltip trigger={
                    <div className={"flex-none"}>
                        <IconButton
                            icon={<BiCollection/>}
                            size={"sm"}
                            intent={"success-subtle"}
                            className={"flex-none"}
                            onClick={() => {
                                setIgnored(false)
                                startTransition(() => {
                                    rerenderFiles()
                                })
                            }}
                        />
                    </div>
                }>
                    Un-ignore file
                </Tooltip>
            </div>
        </div>
    )
}
