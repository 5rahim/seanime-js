import { atomWithStorage } from "jotai/utils"
import { GogoAnimeServer, ZoroServer } from "@/lib/consumet/types"
import { withImmer } from "jotai-immer"
import { useSetAtom } from "jotai/react"
import { focusAtom } from "jotai-optics"
import { atom } from "jotai"

export type StreamingProvider = "gogoanime" | "zoro"

export const streamingProviderAtom = atomWithStorage<StreamingProvider>("sea-streaming-provider", "gogoanime", undefined, { unstable_getOnInit: true })

export const zoroStreamingServerAtom = atomWithStorage<ZoroServer>("sea-streaming-zoro-server", "vidstreaming", undefined, { unstable_getOnInit: true })

export const gogoAnimeStreamingServerAtom = atomWithStorage<GogoAnimeServer>("sea-streaming-gogoanime-server", "gogocdn", undefined, { unstable_getOnInit: true })

export const streamingAutoplayAtom = atomWithStorage("sea-streaming-autoplay", false, undefined, { unstable_getOnInit: true })

export const streamingResolutionAtom = atomWithStorage("sea-streaming-quality", "auto", undefined, { unstable_getOnInit: true })

export type PlaybackPosition = {
    id: string, // mediaId/episodeNumber
    position: number
    duration: number
}

const playbackPositionsAtom = atomWithStorage<PlaybackPosition[]>("sea-streaming-playback-positions", [], undefined, { unstable_getOnInit: true })

const playbackPositionsAtomWithImmer = withImmer(playbackPositionsAtom)

export function useStreamingPlaybackPosition() {
    const setter = useSetAtom(playbackPositionsAtomWithImmer)

    return {
        updatePlaybackPosition: (status: { id: string, position: number, duration: number }) => {
            setter(draft => {
                const index = draft.findIndex(n => n?.id === status.id)
                if (index !== -1 && status.position !== 0) {
                    draft[index].position = status.position
                    draft[index].duration = status.duration
                    // draft[index].seek = Math.round(status.duration * status.position)
                    return
                }
                if (index === -1) {
                    draft.push({
                        id: status.id,
                        position: status.position,
                        duration: status.duration,
                        // seek: Math.round(status.duration * status.position),
                    })
                    return
                }
            })
        },
        cleanPlaybackPosition: (status: { id: string }) => {
            setter(draft => {
                return draft.filter(n => n?.id !== status.id)
            })
        },
    }
}

/**
 * @example
 * const getPlaybackPositon = useSetAtom(getFilePlaybackPositionAtom)
 * getPlaybackPositon("id")
 */
export const getStreamPlaybackPositionAtom = atom(null,
    (get, set, id: string) => get(focusAtom(playbackPositionsAtom, optic => optic.find(n => n?.id === id))),
)
