/* -------------------------------------------------------------------------------------------------
 * Unused
 * -----------------------------------------------------------------------------------------------*/
import { atomWithStorage } from "jotai/utils"
import { withImmer } from "jotai-immer"
import { atom } from "jotai"
import { focusAtom } from "jotai-optics"
import { VideoPlayerRepositoryPlaybackStatus } from "@/lib/video-player/types"
import { useSetAtom } from "jotai/react"

/* -------------------------------------------------------------------------------------------------
 * Pick up where you left off
 * -----------------------------------------------------------------------------------------------*/

export type PlaybackPosition = {
    fileName: string,
    completionPercentage: number
    seek: number
}

const playbackPositionsAtom = atomWithStorage<PlaybackPosition[]>("sea-playback-positions", [], undefined, { unstable_getOnInit: true })

const playbackPositionsAtomWithImmer = withImmer(playbackPositionsAtom)

export function usePlaybackPosition() {
    const setter = useSetAtom(playbackPositionsAtomWithImmer)

    return {
        updatePlaybackPosition: (status: VideoPlayerRepositoryPlaybackStatus) => {
            setter(draft => {
                const index = draft.findIndex(n => n?.fileName === status.fileName)
                if (index !== -1 && status.completionPercentage !== 0) {
                    draft[index].completionPercentage = status.completionPercentage
                    draft[index].seek = Math.round(status.duration * status.completionPercentage)
                    return
                }
                if (index === -1) {
                    draft.push({
                        fileName: status.fileName,
                        completionPercentage: status.completionPercentage,
                        seek: Math.round(status.duration * status.completionPercentage),
                    })
                    return
                }
            })
        },
        cleanPlaybackPosition: (status: VideoPlayerRepositoryPlaybackStatus) => {
            setter(draft => {
                return draft.filter(n => n?.fileName !== status.fileName)
            })
        },
    }
}

/**
 * @example
 * const getPlaybackPositon = useSetAtom(getFilePlaybackPositionAtom)
 * getPlaybackPositon("fileName")
 */
export const getPlaybackPositionAtom = atom(null,
    (get, set, fileName: string) => get(focusAtom(playbackPositionsAtom, optic => optic.find(n => n?.fileName === fileName))),
)
