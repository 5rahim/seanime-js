"use client"

import {
    useLocalFileAtomByPath,
    useLocalFileAtomsByMediaId,
    useLocalFilesByMediaId_UNSTABLE,
    useSetLocalFiles,
} from "@/atoms/library/local-file.atoms"
import { LocalFile } from "@/lib/local-library/local-file"
import { PrimitiveAtom } from "jotai"
import { useEffect } from "react"
import { useFocusSetAtom, useSelectAtom, useStableSelectAtom } from "@/atoms/helpers"

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
    const path = useSelectAtom(fileAtom, file => file.path)
    const name = useSelectAtom(fileAtom, file => file.name)

    useEffect(() => {
        console.log(`${fileAtom}`, "file element re-rendered")
    })

    return (
        <div>
            <div>
                <LockStatus path={path}/>
                <IgnoredStatus path={path}/> {name}
                <ActionSection fileAtom={fileAtom}/>
            </div>
        </div>
    )
}

const ActionSection = ({ fileAtom }: { fileAtom: PrimitiveAtom<LocalFile> }) => {
    // const [, setFile] = useImmerAtom(fileAtom)
    const setFileLocked = useFocusSetAtom(fileAtom, "locked")
    const setFileIgnored = useFocusSetAtom(fileAtom, "ignored")
    return (
        <>
            <button onClick={() => setFileLocked(prev => !prev)}>toggle lock
            </button>
            <button onClick={() => setFileIgnored(prev => !prev)}>toggle ignored
            </button>
        </>
    )
}

const LockStatus = ({ path }: { path: string }) => {
    const fileAtom = useLocalFileAtomByPath(path)
    const locked = useStableSelectAtom(fileAtom, file => file.locked) || false
    useEffect(() => {
        console.log("locked status re-rendered")
    })
    return (
        <>
            [{`${locked}`}]
        </>
    )
}

const IgnoredStatus = ({ path }: { path: string }) => {
    const fileAtom = useLocalFileAtomByPath(path)
    const ignored = useStableSelectAtom(fileAtom, file => file.ignored) || false

    useEffect(() => {
        console.log("ignored status re-rendered")
    })
    return (
        <>
            [{`${ignored}`}]
        </>
    )
}

const ToggleAll = (props: { mediaId: number }) => {

    const files = useLocalFilesByMediaId_UNSTABLE(props.mediaId)
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
