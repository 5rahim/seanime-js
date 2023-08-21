"use client"

import { useLocalFileAtomsByMediaId, useLocalFilesByMediaId, useSetLocalFiles } from "@/atoms/library/local-file.atoms"
import { LocalFile } from "@/lib/local-library/local-file"
import { PrimitiveAtom } from "jotai"
import { useImmerAtom } from "jotai-immer"
import { useEffect } from "react"
import { useLibraryEntryByMediaId } from "@/atoms/library/library-entry.atoms"

export default function Page() {

    return (
        <div className={"flex gap-8"}>
            <LibraryTest/>
            <ElementOne mediaId={1}/>
            <ElementOne mediaId={889}/>
        </div>
    )
}

const LibraryTest = () => {

    const value = useLibraryEntryByMediaId(21)

    useEffect(() => {
        console.log(value)
    }, [value])


    return (
        <div>

        </div>
    )
}

const ElementOne = (props: { mediaId: number }) => {

    const localFileAtoms = useLocalFileAtomsByMediaId(props.mediaId)

    return (
        <div>
            <ToggleAll mediaId={props.mediaId}/>
            {localFileAtoms.map(fileAtom => (
                <ElementTwo key={`${fileAtom}`} fileAtom={fileAtom}/>
            ))}
        </div>
    )
}

const ElementTwo = (props: { fileAtom: PrimitiveAtom<LocalFile> }) => {

    const { fileAtom } = props
    const [file, setFile] = useImmerAtom(fileAtom)

    return (
        <div>
            <div>[{`${file.locked}`}] {file.name}
                <button onClick={() => setFile(draft => {
                    draft.locked = !draft.locked
                    return
                })}>toggle
                </button>
            </div>
        </div>
    )
}

const ToggleAll = (props: { mediaId: number }) => {

    const files = useLocalFilesByMediaId(props.mediaId)
    const allFilesLocked = files.every(file => file.locked)
    const setFiles = useSetLocalFiles()

    return (
        <button onClick={() => setFiles(draft => {
            for (const draftFile of draft) {
                if (draftFile.mediaId === props.mediaId) {
                    draftFile.locked = !allFilesLocked
                }
            }
            return
        })
        }>
            {allFilesLocked ? "Unlock all" : "Lock all"}
        </button>
    )
}
