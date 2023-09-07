import { atom, PrimitiveAtom } from "jotai"
import { useAtom, useAtomValue } from "jotai/react"
import { useMemo } from "react"
import { AnilistShortMedia, AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { atomWithStorage, splitAtom } from "jotai/utils"

export const allUserMediaAtom = atomWithStorage<AnilistShowcaseMedia[]>("sea-anilist-media", [], undefined, { unstable_getOnInit: true })
export const allUserMediaAtoms = splitAtom(allUserMediaAtom, media => media.id)


/* -------------------------------------------------------------------------------------------------
 * Read atoms
 * -----------------------------------------------------------------------------------------------*/

export const getUserMediaAtomByIdAtom = atom(null,
    (get, set, mediaId: number) => get(allUserMediaAtoms).find((media) => get(media).id === mediaId),
)
export const getUserMediaByIdAtom = atom(null,
    (get, set, mediaId: number) => {
        const atom = get(allUserMediaAtoms).find((media) => get(media).id === mediaId)
        if (atom)
            return get(atom)
        else
            return undefined
    },
)

/**
 * @example
 * const mediaAtom = useAnilistUserMediaAtom(21)
 *
 * const value = useSelectAtom(mediaAtom, media => media[property])
 */
export const useAnilistUserMediaAtomById = (mediaId: number) => {
    const [, get] = useAtom(getUserMediaAtomByIdAtom)
    return useMemo(() => get(mediaId), []) as PrimitiveAtom<AnilistShowcaseMedia> | undefined
}
export const useAnilistUserMediaAtoms = () => {
    const value = useAtomValue(allUserMediaAtoms)
    return useMemo(() => value, []) as Array<PrimitiveAtom<AnilistShowcaseMedia>>
}

/* -------------------------------------------------------------------------------------------------
 * Read value
 * -----------------------------------------------------------------------------------------------*/

/**
 * /!\ Unstable due to `nextAiringEpisode.timeUntilAiring`
 * @example
 * const media = useAnilistUserMedia(21)
 *
 * const title = media?.title?.english //=> One Piece
 */
export const useAnilistUserMediaId_UNSTABLE = (mediaId: number) => {
    const [, get] = useAtom(getUserMediaByIdAtom)
    return useMemo(() => get(mediaId), []) as AnilistShortMedia | undefined
}
