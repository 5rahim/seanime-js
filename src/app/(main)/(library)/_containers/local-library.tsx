"use client"
import React from "react"

import {
    completed_libraryEntryAtoms,
    currentlyWatching_libraryEntryAtoms,
    LibraryEntry,
    rest_libraryEntryAtoms,
} from "@/atoms/library/library-entry.atoms"
import { Atom } from "jotai"
import { useSelectAtom } from "@/atoms/helpers"
import { AnimeListItem } from "@/components/shared/anime-list-item"
import { Divider } from "@/components/ui/divider"
import { useAtomValue } from "jotai/react"

interface LocalLibraryProps {
    children?: React.ReactNode
}

export const LocalLibrary: React.FC<LocalLibraryProps> = (props) => {

    const { children, ...rest } = props

    const currentlyWatchingEntryAtoms = useAtomValue(currentlyWatching_libraryEntryAtoms)
    const restEntryAtoms = useAtomValue(rest_libraryEntryAtoms)
    const completedEntryAtoms = useAtomValue(completed_libraryEntryAtoms)

    return (
        <div className={"p-4 space-y-8"}>
            {currentlyWatchingEntryAtoms.length > 0 && <>
                <h2>Continue watching</h2>
                <div className={"grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"}>
                    {currentlyWatchingEntryAtoms.map(entryAtom => {
                        return <EntryAnimeItem key={`${entryAtom}`} entryAtom={entryAtom}/>
                    })}
                </div>
                <Divider/>
            </>}
            <div className={"grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"}>
                {restEntryAtoms.map(entryAtom => {
                    return <EntryAnimeItem key={`${entryAtom}`} entryAtom={entryAtom}/>
                })}
            </div>
            {completedEntryAtoms.length > 0 && <>
                <Divider/>
                <h2>Completed</h2>
                <div className={"grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"}>
                    {completedEntryAtoms.map(entryAtom => {
                        return <EntryAnimeItem key={`${entryAtom}`} entryAtom={entryAtom}/>
                    })}
                </div>
            </>}
        </div>
    )

}

const EntryAnimeItem = (props: { entryAtom: Atom<LibraryEntry> }) => {

    const { entryAtom } = props

    const media = useSelectAtom(entryAtom, entry => entry.media)

    return (
        <AnimeListItem key={`${media.id}`} mediaId={media.id}/>
    )

}
