/* -------------------------------------------------------------------------------------------------
 * Basically, this entire file is just notify the user about missing episodes
 * -----------------------------------------------------------------------------------------------*/

import { Atom } from "jotai"
import { LibraryEntry } from "@/atoms/library/library-entry.atoms"
import React from "react"
import { useSelectAtom } from "@/atoms/helpers"
import { useMediaDownloadInfo } from "@/lib/download/helpers"

type Props = {
    entryAtoms: Atom<LibraryEntry>[]
}

export function FetchMediaSchedule(props: Props) {
    return (
        <>
            {props.entryAtoms.map(entryAtom => {
                return <Item key={`${entryAtom}`} entryAtom={entryAtom}/>
            })}
        </>
    )
}

type ItemProps = {
    entryAtom: Atom<LibraryEntry>
}

function Item(props: ItemProps) {

    const media = useSelectAtom(props.entryAtom, entry => entry.media)

    const {
        downloadInfo,
    } = useMediaDownloadInfo(media)

    return null
}
