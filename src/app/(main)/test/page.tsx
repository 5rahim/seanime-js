"use client"

import { LibraryEntry, useLibraryEntryAtoms } from "@/atoms/library/library-entry.atoms"
import React from "react"
import { PrimitiveAtom } from "jotai"
import { useSelectAtom } from "@/atoms/helpers"
import { AnimeListItem } from "@/components/application/list/anime-list-item"

export default function Page() {

    const entryAtoms = useLibraryEntryAtoms()

    return (
        <div className={"px-4"}>
            <div className={"grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"}>
                {entryAtoms.map(entryAtom => {
                    return <EntryAnimeItem key={`${entryAtom}`} entryAtom={entryAtom}/>
                })}
            </div>
        </div>
    )
}

const EntryAnimeItem = (props: { entryAtom: PrimitiveAtom<LibraryEntry> }) => {

    const { entryAtom } = props

    const media = useSelectAtom(entryAtom, entry => entry.media)

    return (
        <AnimeListItem key={`${media.id}`} mediaId={media.id}/>
    )

}
