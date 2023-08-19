"use client"
import React from "react"
import { useSettings } from "@/atoms/settings"
import { useLibraryEntries, useStoredLocalFiles } from "@/atoms/library"
import { AnimeList } from "@/components/application/list/anime-list"
import { useStoredAnilistCollection } from "@/atoms/anilist-collection"
import { IconButton } from "@/components/ui/button"
import { VscVerified } from "@react-icons/all-files/vsc/VscVerified"
import { BiLockOpenAlt } from "@react-icons/all-files/bi/BiLockOpenAlt"
import { Tooltip } from "@/components/ui/tooltip"

interface LocalLibraryProps {
    children?: React.ReactNode
}

export const LocalLibrary: React.FC<LocalLibraryProps> = (props) => {

    const { children, ...rest } = props

    const { settings } = useSettings()
    const { entries } = useLibraryEntries()
    const { collection } = useStoredAnilistCollection()

    const { localFiles, getMediaFiles, toggleMediaFileLocking } = useStoredLocalFiles()

    return (
        <div className={"px-4"}>
            <AnimeList
                items={[
                    ...entries.map(entry => {
                        const listEntry = collection.find(m => m?.media?.id === entry.media.id)
                        const files = getMediaFiles(entry?.media.id)
                        const allFilesAreLocked = files.every(file => file.locked)
                        // console.log(listEntry)
                        return listEntry ? {
                            media: listEntry.media,
                            progress: { watched: listEntry.progress ?? 0, total: listEntry?.media?.episodes },
                            score: listEntry?.score,
                            isInLocalLibrary: true,
                            hideLibraryBadge: true,
                            action: <>
                                <Tooltip trigger={
                                    <IconButton
                                        icon={allFilesAreLocked ? <VscVerified/> : <BiLockOpenAlt/>}
                                        intent={allFilesAreLocked ? "success" : "warning-subtle"}
                                        size={"sm"}
                                        className={"hover:opacity-60"}
                                        onClick={() => toggleMediaFileLocking(entry?.media.id)}
                                    />
                                }>
                                    {allFilesAreLocked ? "Unlock all files" : "Lock all files"}
                                </Tooltip>
                            </>,
                        } : {
                            media: entry.media,
                            isInLocalLibrary: true,
                            hideLibraryBadge: true,
                        }
                    }),
                ].filter(Boolean)}
            />
        </div>
    )

}
