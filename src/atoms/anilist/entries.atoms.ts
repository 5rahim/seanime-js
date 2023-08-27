import { useAtom, useAtomValue, useSetAtom } from "jotai/react"
import { selectAtom, splitAtom } from "jotai/utils"
import { useCallback, useMemo } from "react"
import deepEquals from "fast-deep-equal"
import { atom, PrimitiveAtom } from "jotai"
import { anilistCollectionAtom, useRefreshAnilistCollection } from "@/atoms/anilist/collection.atoms"
import { MediaListStatus, UpdateEntryMutationVariables } from "@/gql/graphql"
import { AnilistShortMedia } from "@/lib/anilist/fragment"
import { updateEntry } from "@/lib/anilist/actions"
import { aniListTokenAtom } from "@/atoms/auth"
import { allUserMediaAtoms } from "@/atoms/anilist/media.atoms"

// Typescript's being annoying, so I had to extract the type myself
export type AnilistCollectionEntry = {
    score?: number | null,
    progress?: number | null,
    status?: MediaListStatus | null,
    notes?: string | null,
    repeat?: number | null,
    private?: boolean | null,
    startedAt?: { year?: number | null, month?: number | null, day?: number | null } | null,
    completedAt?: { year?: number | null, month?: number | null, day?: number | null } | null,
    media?: AnilistShortMedia | null
} | null | undefined

/* -------------------------------------------------------------------------------------------------
 * Anilist Collection Entries
 * - Each entry holds specific data like score, progress...
 * - Each entry also contains a specific media
 * -----------------------------------------------------------------------------------------------*/

export const anilistCollectionEntriesAtom = atom<AnilistCollectionEntry[]>((get) => {
    const arr = get(anilistCollectionAtom)?.lists?.map(n => n?.entries)?.flat().filter(Boolean)
    return arr !== undefined ? arr : []
})
/**
 * Split collection entries by media ID
 */
export const anilistCollectionEntryAtoms = splitAtom(anilistCollectionEntriesAtom, collectionEntry => collectionEntry?.media?.id)
// Read
const getAnilist_CollectionEntry_Atoms_ByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => get(anilistCollectionEntryAtoms).find((entryAtom) => get(entryAtom)?.media?.id === mediaId),
)
export const useAnilistCollectionEntryAtomByMediaId = (mediaId: number) => {
    const [, get] = useAtom(getAnilist_CollectionEntry_Atoms_ByMediaIdAtom)
    return useMemo(() => get(mediaId), []) as PrimitiveAtom<AnilistCollectionEntry> | undefined
}
export const useAnilistCollectionEntryByMediaId = (mediaId: number) => {
    return useAtomValue(
        selectAtom(
            anilistCollectionEntriesAtom,
            useCallback(entries => entries.find(entry => entry?.media?.id === mediaId), []), // Stable reference
            deepEquals, // Equality check
        ),
    )
}

/* -------------------------------------------------------------------------------------------------
 * Update entries
 * -----------------------------------------------------------------------------------------------*/

export const updateAnilistEntryAtom = atom(null,
    async (get, set, payload: UpdateEntryMutationVariables) => {
        await updateEntry(payload, get(aniListTokenAtom))
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
            await updateEntry({
                mediaId: media.id,
                progress: payload.episode <= maxEp ? payload.episode : maxEp,
                status: payload.episode === 1 && media.episodes !== 1 ? "CURRENT" : undefined,
            }, get(aniListTokenAtom))
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
            await watchedEntry(payload)
            await refetchCollection()
        }, []),
    }
}
