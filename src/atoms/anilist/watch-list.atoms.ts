import { atom } from "jotai"
import { anilistCollectionEntriesAtom } from "@/atoms/anilist/entries.atoms"
import _ from "lodash"

export const anilistCompletedListAtom = atom((get) => {
    let arr = get(anilistCollectionEntriesAtom).filter(n => !!n && n.status === "COMPLETED")
    // Sort by name
    arr = _.sortBy(arr, entry => entry?.media?.title?.userPreferred).reverse()
    // Sort by score
    arr = _.sortBy(arr, entry => entry?.score).reverse()
    return arr
})
export const anilistCurrentlyWatchingListAtom = atom((get) => {
    let arr = get(anilistCollectionEntriesAtom).filter(n => !!n && n.status === "CURRENT")
    // Sort by name
    arr = _.sortBy(arr, entry => entry?.media?.title?.userPreferred).reverse()
    // Sort by score
    arr = _.sortBy(arr, entry => entry?.score).reverse()
    return arr
})
export const anilistPlanningListAtom = atom((get) => {
    let arr = get(anilistCollectionEntriesAtom).filter(n => !!n && n.status === "PLANNING")
    // Sort by name
    arr = _.sortBy(arr, entry => entry?.media?.title?.userPreferred)
    // Sort by airing -> Releasing first
    arr = _.sortBy(arr, entry => entry?.media?.status !== "RELEASING")
    return arr
})
export const anilistPausedListAtom = atom((get) => {
    let arr = get(anilistCollectionEntriesAtom).filter(n => !!n && n.status === "PAUSED")
    // Sort by name
    arr = _.sortBy(arr, entry => entry?.media?.title?.userPreferred).reverse()
    // Sort by score
    arr = _.sortBy(arr, entry => entry?.score).reverse()
    return arr
})
