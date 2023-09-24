import { atom } from "jotai"
import { anilistCollectionEntriesAtom } from "@/atoms/anilist/entries.atoms"
import { filterEntriesByTitle } from "@/lib/anilist/utils"
import sortBy from "lodash/sortBy"

export const watchListSearchInputAtom = atom<string>("")

export const anilistCompletedListAtom = atom((get) => {
    let arr = get(anilistCollectionEntriesAtom).filter(n => !!n && n.status === "COMPLETED")
    // Sort by name
    arr = sortBy(arr, entry => entry?.media?.title?.userPreferred).reverse()
    // Sort by score
    arr = sortBy(arr, entry => entry?.score).reverse()
    return filterEntriesByTitle(arr, get(watchListSearchInputAtom))
})
export const anilistCurrentlyWatchingListAtom = atom((get) => {
    let arr = get(anilistCollectionEntriesAtom).filter(n => !!n && n.status === "CURRENT")
    // Sort by name
    arr = sortBy(arr, entry => entry?.media?.title?.userPreferred).reverse()
    // Sort by score
    arr = sortBy(arr, entry => entry?.score).reverse()
    return filterEntriesByTitle(arr, get(watchListSearchInputAtom))
})
export const anilistPlanningListAtom = atom((get) => {
    let arr = get(anilistCollectionEntriesAtom).filter(n => !!n && n.status === "PLANNING")
    // Sort by name
    arr = sortBy(arr, entry => entry?.media?.title?.userPreferred)
    // Sort by airing -> Releasing first
    arr = sortBy(arr, entry => entry?.media?.status !== "RELEASING")
    return filterEntriesByTitle(arr, get(watchListSearchInputAtom))
})
export const anilistPausedListAtom = atom((get) => {
    let arr = get(anilistCollectionEntriesAtom).filter(n => !!n && n.status === "PAUSED")
    // Sort by name
    arr = sortBy(arr, entry => entry?.media?.title?.userPreferred).reverse()
    // Sort by score
    arr = sortBy(arr, entry => entry?.score).reverse()
    return filterEntriesByTitle(arr, get(watchListSearchInputAtom))
})
