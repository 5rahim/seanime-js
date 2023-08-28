import { startTransition, useCallback, useRef } from "react"
import { VideoPlayerRepository } from "@/lib/video-player/index"
import { useSettings } from "@/atoms/settings"
import { useInterval, useToggle, useUpdateEffect } from "react-use"
import { logger } from "@/lib/helpers/debug"
import { VideoPlayerRepositoryPlaybackStatus } from "@/lib/video-player/types"
import { useSetAtom } from "jotai/react"
import { getFilePlaybackPositionAtom, useUpdatePlaybackPosition } from "@/atoms/video-player.atoms"
import { getLocalFileByPathAtom } from "@/atoms/library/local-file.atoms"

export function useVideoPlayer(props?: {
    onPlayerClosed?: () => void
    onTick?: (status: VideoPlayerRepositoryPlaybackStatus) => void
    onVideoComplete?: (fileName: string) => void // Will trigger when user watched video above the threshold or played the next file above a certain threshold
    onFilePlay?: () => void
    sameFileThreshold?: number
    nextFileThreshold?: number
}) {
    const { settings } = useSettings()
    const videoPlayerRepository = useRef(VideoPlayerRepository(settings))

    const threshold = useRef({ complete: props?.sameFileThreshold || 0.9, next: props?.nextFileThreshold || 0.9 })
    const playbackFileName = useRef<string | null>(null) // Keep track of current file being played
    const watched = useRef<boolean>(false) // Keep track of watch status

    const [tracking, toggleTracking] = useToggle(false)

    const { updatePlaybackPosition, cleanPlaybackPosition } = useUpdatePlaybackPosition()
    const getFilePlaybackPosition = useSetAtom(getFilePlaybackPositionAtom)
    const getLocalFileByPath = useSetAtom(getLocalFileByPathAtom)

    useUpdateEffect(() => {
        videoPlayerRepository.current = VideoPlayerRepository(settings)
    }, [settings])

    useInterval(async () => {
        const status = await videoPlayerRepository.current.getPlaybackStatus()
        if (!!status) {
            console.log(status)
            props?.onTick && props.onTick(status)

            if ((!isNaN(status.percentageComplete) || (status.state as any) !== "n/a") && status.percentageComplete < threshold.current.complete) {
                updatePlaybackPosition(status)
            }

            if (status.percentageComplete >= threshold.current.complete) {
                cleanPlaybackPosition(status)
            }

            if (
                !watched.current // File was not watched
                && (status.percentageComplete >= threshold.current.complete) // Completion is above the threshold
                && (playbackFileName.current === status.fileName) // Latest file is the same as the one being tracked
            ) {
                cleanPlaybackPosition(status)
                props?.onVideoComplete && props.onVideoComplete(playbackFileName.current)
                watched.current = true
            }

            // Latest file is not the same as the one being tracked
            if (playbackFileName.current !== null && playbackFileName.current !== status.fileName) {
                logger("use-video-player").info("File changed")
                watched.current = false
            }

            if (playbackFileName.current !== status.fileName) {
                startTransition(() => {
                    playbackFileName.current = status.fileName // Update playback file name
                })
            }
        } else if (tracking) { // Player closed

            logger("use-video-player").warning("Player closed")
            props?.onPlayerClosed && props.onPlayerClosed()
            playbackFileName.current = null
            watched.current = false
            toggleTracking(false)

        }
    }, tracking ? 1000 : null)

    return {
        videoPlayer: videoPlayerRepository.current,
        playFile: useCallback(async (path: string) => {
            const file = getLocalFileByPath(path)
            const playbackPosition = getFilePlaybackPosition(file?.name || "")
            console.log(playbackPosition)

            logger("use-video-player").info("Opening video")

            const success = await videoPlayerRepository.current.openVideo(path, {
                muteAlert: true,
                seek: playbackPosition?.seek,
            })
            if (!success) {
                logger("use-video-player").warning("Could not open video, starting player")

                toggleTracking(false)
                await videoPlayerRepository.current.start()

                logger("use-video-player").info("Player started, retrying")

                startTransition(() => {
                    setTimeout(() => {
                        (async () => {
                            logger("use-video-player").info("Opening video again")

                            const success = await videoPlayerRepository.current.openVideo(path, { seek: playbackPosition?.seek })

                            if (!success) {
                                logger("use-video-player").error("Could not open video. Abort")
                            } else {
                                logger("use-video-player").info("Video opened, tracking started")

                                toggleTracking(success)
                                props?.onFilePlay && props.onFilePlay()
                            }
                        })()
                    }, 1000)
                })
            } else {
                logger("use-video-player").info("Video opened, tracking started")
                toggleTracking(success)
                props?.onFilePlay && props.onFilePlay()
            }
        }, [videoPlayerRepository.current]),
    }
}
