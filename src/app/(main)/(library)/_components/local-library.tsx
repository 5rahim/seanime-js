"use client"
import React from "react"
import { useSettings } from "@/atoms/settings"
import { useLibraryEntries } from "@/atoms/library"
import { AnimeList } from "@/components/application/list/anime-list"
import { useStoredAnilistCollection } from "@/atoms/anilist-collection"

interface LocalLibraryProps {
    children?: React.ReactNode
}

export const LocalLibrary: React.FC<LocalLibraryProps> = (props) => {

    const { children, ...rest } = props

    const { settings } = useSettings()
    const { entries } = useLibraryEntries()
    const { collection } = useStoredAnilistCollection()

    // useEffect(() => {
    //     ()()
    // }, [])

    // TODO Add option to lock individual files or entire media files in the View Page
    // TODO Add link to view page
    // TODO Action -> Show option to rename parent folder and rescan

    return (
        <div className={"px-4"}>
            <AnimeList
                items={[
                    ...entries.map(entry => {
                        const listEntry = collection.find(m => m?.media?.id === entry.media.id)
                        // console.log(listEntry)
                        return listEntry ? {
                            media: listEntry.media,
                            progress: { watched: listEntry.progress ?? 0, total: listEntry?.media?.episodes },
                            score: listEntry?.score,
                        } : {
                            media: entry.media,
                        }
                    }),
                ].filter(Boolean)}
            />
        </div>
    )

}
