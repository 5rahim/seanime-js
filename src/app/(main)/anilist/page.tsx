"use client"

import React, { startTransition, useState, useTransition } from "react"
import { useSettings } from "@/atoms/settings"
import { TabPanels } from "@/components/ui/tabs"
import { cn } from "@/components/ui/core"
import { Atom, atom } from "jotai"
import { useAtom } from "jotai/react"
import { useSelectAtom } from "@/atoms/helpers"
import { AnimeListItem } from "@/components/shared/anime-list-item"
import { LoadingOverlay } from "@/components/ui/loading-spinner"
import { AnilistCollectionEntry } from "@/atoms/anilist/entries.atoms"
import {
    anilistCompletedListAtom,
    anilistCurrentlyWatchingListAtom,
    anilistPausedListAtom,
    anilistPlanningListAtom,
    watchListSearchInputAtom,
} from "@/atoms/anilist/watch-list.atoms"
import { TextInput } from "@/components/ui/text-input"
import { FiSearch } from "@react-icons/all-files/fi/FiSearch"

const selectedIndexAtom = atom(0)

export default function Home() {

    const { settings } = useSettings()

    const [selectedIndex, setSelectedIndex] = useAtom(selectedIndexAtom)
    const [pending, startTransition] = useTransition()

    return (
        <main className={"px-4 relative"}>


            <TabPanels
                navClassName={"border-none"}
                tabClassName={cn(
                    "text-lg rounded-none border-b border-b-2 border-b-transparent data-[selected=true]:text-white data-[selected=true]:border-brand-400",
                    "dark:border-transparent dark:hover:border-b-transparent dark:data-[selected=true]:border-brand-400 dark:data-[selected=true]:text-white",
                    "hover:bg-[--highlight]",
                )}
                selectedIndex={selectedIndex}
                onIndexChange={value => {
                    startTransition(() => {
                        setSelectedIndex(value)
                    })
                }}
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
                <TabPanels.Container className="pt-8 relative">

                    <SearchInput/>

                    <LoadingOverlay className={cn("z-50 backdrop-blur-none", { "hidden": !pending })}/>

                    <TabPanels.Panel>
                        <WatchList collectionEntriesAtom={anilistCurrentlyWatchingListAtom}/>
                    </TabPanels.Panel>
                    <TabPanels.Panel>
                        <WatchList collectionEntriesAtom={anilistPlanningListAtom}/>
                    </TabPanels.Panel>
                    <TabPanels.Panel>
                        <WatchList collectionEntriesAtom={anilistPausedListAtom}/>
                    </TabPanels.Panel>
                    <TabPanels.Panel>
                        <WatchList collectionEntriesAtom={anilistCompletedListAtom}/>
                    </TabPanels.Panel>
                </TabPanels.Container>
            </TabPanels>

        </main>
    )
}

const WatchList = React.memo(({ collectionEntriesAtom }: { collectionEntriesAtom: Atom<AnilistCollectionEntry[]> }) => {

    const collectionEntriesMedia = useSelectAtom(collectionEntriesAtom, entries => entries.map(entry => entry?.media).filter(Boolean))

    return (
        <div className={"px-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"}>
            {collectionEntriesMedia.map(media => (
                <AnimeListItem key={`${media.id}`} mediaId={media.id} showLibraryBadge={true}/>
            ))}
        </div>
    )

})

const SearchInput = () => {

    const [input, setter] = useAtom(watchListSearchInputAtom)
    const [inputValue, setInputValue] = useState(input)

    return (
        <div className={"px-4 mb-8"}>
            <TextInput leftIcon={<FiSearch/>} value={inputValue} onChange={e => {
                setInputValue(e.target.value)
                startTransition(() => {
                    setter(e.target.value)
                })
            }}/>
        </div>
    )
}
