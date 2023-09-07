import { useAtom, useAtomValue, useSetAtom } from "jotai/react"
import { selectAtom, splitAtom } from "jotai/utils"
import { useCallback, useMemo } from "react"
import deepEquals from "fast-deep-equal"
import { atom, PrimitiveAtom } from "jotai"
import { anilistCollectionAtom, useRefreshAnilistCollection } from "@/atoms/anilist/collection.atoms"
import { DeleteEntryMutationVariables, MediaListStatus, UpdateEntryMutationVariables } from "@/gql/graphql"
import { AnilistShortMedia } from "@/lib/anilist/fragment"
import { deleteEntry, updateEntry } from "@/lib/anilist/actions"
import { aniListTokenAtom } from "@/atoms/auth"
import { allUserMediaAtoms } from "@/atoms/anilist/media.atoms"
import toast from "react-hot-toast"

// Typescript's being annoying, so I had to extract the type myself
export type AnilistCollectionEntry = {
    id: number,
    score?: number | null,
    progress?: number | null,
    status?: MediaListStatus | null,
    notes?: string | null,
    repeat?: number | null,
    private?: boolean | null,
    startedAt?: { year?: number | null, month?: number | null, day?: number | null } | null,
    completedAt?: { year?: number | null, month?: number | null, day?: number | null } | null,
    media?: AnilistShortMedia | null
    timestamp: any
} | null | undefined

/* -------------------------------------------------------------------------------------------------
 * Anilist Collection Entries
 * - Each entry holds specific data like score, progress...
 * - Each entry also contains a specific media
 * -----------------------------------------------------------------------------------------------*/

export const anilistCollectionEntriesAtom = atom<AnilistCollectionEntry[]>((get) => {
    // const arr = get(anilistCollectionAtom)?.lists?.map(n => n?.entries)?.flat().filter(Boolean)
    const arr = get(anilistCollectionAtom)?.lists?.map(n => n?.entries)?.flat().filter(Boolean).map(n => ({
        ...n,
        timestamp: new Date().getTime(),
    }))
    return arr !== undefined ? arr : []
})
/**
 * Split collection entries by media ID
 */
export const anilistCollectionEntryAtoms = splitAtom(anilistCollectionEntriesAtom, collectionEntry => collectionEntry?.media?.id)
// Read
const getAnilist_CollectionEntry_Atoms_ByMediaIdAtom = atom(get => get(anilistCollectionEntryAtoms).length,
    (get, set, mediaId: number) => get(anilistCollectionEntryAtoms).find((entryAtom) => get(entryAtom)?.media?.id === mediaId),
)

/**
 * Almost stable
 * Refreshes when the number of collection entry changes
 * @param mediaId
 */
export const useAnilistCollectionEntryAtomByMediaId = (mediaId: number) => {
    const [value, get] = useAtom(getAnilist_CollectionEntry_Atoms_ByMediaIdAtom)
    return useMemo(() => get(mediaId), [value]) as PrimitiveAtom<AnilistCollectionEntry> | undefined
}

/**
 * /!\ Unstable use `useAnilistCollectionEntryAtomByMediaId`
 * /!\ Causes re-renders when AniList entries are refreshed
 * @param mediaId
 */
export const useAnilistCollectionEntryByMediaId_UNSTABLE = (mediaId: number) => {
    return useAtomValue(
        selectAtom(
            anilistCollectionEntriesAtom,
            useCallback(entries => entries.find(entry => entry?.media?.id === mediaId), []),
            deepEquals, // Equality check
        ),
    )
}

/* -------------------------------------------------------------------------------------------------
 * Update entries
 * -----------------------------------------------------------------------------------------------*/

export const updateAnilistEntryAtom = atom(null,
    async (get, set, payload: UpdateEntryMutationVariables) => {
        const success = await updateEntry(payload, get(aniListTokenAtom))

        if (success) toast.success("Entry updated")
        else toast.error("Could not update entry")
        return success
    },
)

export const deleteAnilistEntryAtom = atom(null,
    async (get, set, payload: DeleteEntryMutationVariables & { status: MediaListStatus }) => {
        if (payload.status === "PLANNING") {
            const success = await deleteEntry(payload, get(aniListTokenAtom))
            if (success) toast.success("Entry deleted")
            else toast.error("Could not update entry")
            return success
        } else {
            toast.error("Cannot delete this entry from Seanime")
        }

    },
)
export const watchedAnilistEntryAtom = atom(null,
    async (get, set, payload: {
        mediaId: number,
        episode: number,
    }) => {
        const mediaAtom = get(allUserMediaAtoms).find((media) => get(media).id === payload.mediaId)
        if (mediaAtom) {
            const media = get(mediaAtom)
            const maxEp = media.nextAiringEpisode?.episode || media.episodes!
            const success = await updateEntry({
                mediaId: media.id,
                progress: payload.episode <= maxEp ? payload.episode : maxEp,
                status: payload.episode === 1 && media.episodes !== 1 ? "CURRENT" : undefined,
            }, get(aniListTokenAtom))

            if (success) toast.success("Entry updated")
            else toast.error("Could not update entry")
            return success
        }
    },
)

export function useWatchedAnilistEntry() {
    const refetchCollection = useRefreshAnilistCollection()
    const watchedEntry = useSetAtom(watchedAnilistEntryAtom)
    return {
        watchedEntry: useCallback(async (payload: {
            mediaId: number,
            episode: number,
        }) => {
            const success = await watchedEntry(payload)
            if (success) await refetchCollection()
        }, []),
    }
}


export function useUpdateAnilistEntry() {
    const refetchCollection = useRefreshAnilistCollection()
    const updateEntry = useSetAtom(updateAnilistEntryAtom)
    const deleteEntry = useSetAtom(deleteAnilistEntryAtom)
    return {
        updateEntry: useCallback(async (payload: UpdateEntryMutationVariables) => {
            const success = await updateEntry(payload)
            if (success) await refetchCollection()
        }, []),
        deleteEntry: useCallback(async (payload: DeleteEntryMutationVariables & { status: MediaListStatus }) => {
            const success = await deleteEntry(payload)
            if (success) await refetchCollection()
        }, []),
    }
}
