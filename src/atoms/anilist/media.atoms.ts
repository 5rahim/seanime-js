import { atom, PrimitiveAtom } from "jotai"
import { useAtom, useAtomValue } from "jotai/react"
import { useCallback, useMemo } from "react"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { atomWithStorage, selectAtom, splitAtom } from "jotai/utils"
import deepEquals from "fast-deep-equal"

export const allUserMediaAtom = atomWithStorage<AnilistShowcaseMedia[]>("sea-anilist-media", [], undefined, { unstable_getOnInit: true })
export const allUserMediaAtoms = splitAtom(allUserMediaAtom, media => media.id)


/* -------------------------------------------------------------------------------------------------
 * Read atoms
 * -----------------------------------------------------------------------------------------------*/

export const getUserMediaAtomByIdAtom = atom(null,
    (get, set, mediaId: number) => get(allUserMediaAtoms).find((media) => get(media).id === mediaId),
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
 * @example
 * const media = useAnilistUserMedia(21)
 *
 * const title = media?.title?.english //=> One Piece
 */
export const useAnilistUserMedia = (mediaId: number) => {
    return useAtomValue(
        selectAtom(
            allUserMediaAtom,
            useCallback(media => media.find(medium => medium.id === mediaId), []), // Stable reference
            deepEquals, // Equality check
        ),
    )
}
