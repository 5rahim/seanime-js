"use client"

import React from "react"
import { useSettings } from "@/atoms/settings"
import { AnimeList } from "@/components/application/list/anime-list"
import { TabPanels } from "@/components/ui/tabs"
import { cn } from "@/components/ui/core"
import { useStoredAnilistCollection } from "@/atoms/anilist-collection"


import { useLibraryEntries } from "@/atoms/library/library-entry.atoms"

export default function Home() {

    const { settings } = useSettings()

    const { currentlyWatchingList, completedList, planningList, pausedList, isLoading } = useStoredAnilistCollection()
    const { entries } = useLibraryEntries()

    return (
        <main className={"px-4"}>

            <TabPanels
                navClassName={"border-none"}
                tabClassName={cn(
                    "text-lg rounded-none border-b border-b-2 border-b-transparent data-[selected=true]:text-white data-[selected=true]:border-brand-400",
                    "dark:border-transparent dark:hover:border-b-transparent dark:data-[selected=true]:border-brand-400",
                    "hover:bg-[--highlight]",
                )}
            >
                <TabPanels.Nav>
                    <TabPanels.Tab>
                        Currently Watching
                    </TabPanels.Tab>
                    <TabPanels.Tab>
                        Planning
                    </TabPanels.Tab>
                    <TabPanels.Tab>
                        Paused
                    </TabPanels.Tab>
                    <TabPanels.Tab>
                        Completed
                    </TabPanels.Tab>
                </TabPanels.Nav>
                <TabPanels.Container className="pt-8">
                    <TabPanels.Panel>
                        <AnimeList
                            items={[
                                ...currentlyWatchingList.map(entry => ({
                                    isInLocalLibrary: entries.some(e => e.media.id === entry?.media?.id),
                                    media: entry?.media,
                                    progress: { watched: entry?.progress ?? 0, total: entry?.media?.episodes },
                                    score: entry?.score,
                                })),
                            ]}
                        />
                    </TabPanels.Panel>
                    <TabPanels.Panel>
                        <AnimeList
                            items={[
                                ...planningList.map(entry => ({
                                    isInLocalLibrary: entries.some(e => e.media.id === entry?.media?.id),
                                    media: entry?.media,
                                })),
                            ]}
                        />
                    </TabPanels.Panel>
                    <TabPanels.Panel>
                        <AnimeList
                            items={[
                                ...pausedList.map(entry => ({
                                    isInLocalLibrary: entries.some(e => e.media.id === entry?.media?.id),
                                    media: entry?.media,
                                    progress: { watched: entry?.progress ?? 0, total: entry?.media?.episodes },
                                    score: entry?.score,
                                })),
                            ]}
                        />
                    </TabPanels.Panel>
                    <TabPanels.Panel>
                        <AnimeList
                            items={[
                                ...completedList.map(entry => ({
                                    isInLocalLibrary: entries.some(e => e.media.id === entry?.media?.id),
                                    media: entry?.media,
                                    score: entry?.score,
                                })),
                            ]}
                        />
                    </TabPanels.Panel>
                </TabPanels.Container>
            </TabPanels>

            {/*<pre>*/}
            {/*    {JSON.stringify(currentlyWatchingList, null, 2)}*/}
            {/*</pre>*/}
        </main>
    )
}
