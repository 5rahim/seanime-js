import { Atom } from "jotai"
import { LibraryEntry } from "@/atoms/library/library-entry.atoms"
import { useSelectAtom } from "@/atoms/helpers"
import { useSetLocalFiles } from "@/atoms/library/local-file.atoms"
import { Tooltip } from "@/components/ui/tooltip"
import { IconButton } from "@/components/ui/button"
import { VscVerified } from "@react-icons/all-files/vsc/VscVerified"
import { BiLockOpenAlt } from "@react-icons/all-files/bi/BiLockOpenAlt"
import React, { startTransition } from "react"

export const ToggleLockStatusButton = (props: { entryAtom: Atom<LibraryEntry> }) => {

    const files = useSelectAtom(props.entryAtom, entry => entry.files)
    const mediaId = useSelectAtom(props.entryAtom, entry => entry.media.id)
    const allFilesLocked = files.every(file => file.locked)
    const setLocalFiles = useSetLocalFiles()

    return (
        <Tooltip trigger={
            <IconButton
                icon={allFilesLocked ? <VscVerified/> : <BiLockOpenAlt/>}
                intent={allFilesLocked ? "success-subtle" : "warning-subtle"}
                size={"xl"}
                className={"hover:opacity-60"}
                onClick={() => {
                    startTransition(() => {
                        setLocalFiles(draft => {
                            for (const draftFile of draft) {
                                if (draftFile.mediaId === mediaId) {
                                    draftFile.locked = !allFilesLocked
                                }
                            }
                            return
                        })
                    })
                }}
            />
        }>
            {allFilesLocked ? "Unlock all files" : "Lock all files"}
        </Tooltip>
    )
}
