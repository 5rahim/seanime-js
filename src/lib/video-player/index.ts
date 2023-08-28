import { _mpc_getPlaybackStatus, _mpc_openVideo } from "@/lib/video-player/mpc-hc/controls"
import { _vlc_getPlaybackStatus, _vlc_openVideo } from "@/lib/video-player/vlc/controls"
import { runCommand } from "@/lib/helpers/child-process"
import { Settings } from "@/atoms/settings"
import toast from "react-hot-toast"
import { VideoPlayerRepositoryApiCallResult } from "@/lib/video-player/types"

export const VideoPlayerRepository = (settings: Settings) => {

    return {
        async start() {
            const location = settings.player[settings.player.defaultPlayer]
            try {
                if (location.length > 0)
                    await runCommand(`"${location}"`)
            } catch (e) {
                toast.error("Could not open the player")
            }
        },
        async openVideo(path: string, options?: { muteAlert?: boolean, seek?: number | null | undefined }) {
            const muteAlert = options?.muteAlert || false
            const seek = options?.seek
            let res
            switch (settings.player.defaultPlayer) {
                case "mpc-hc":
                    res = await _mpc_openVideo(path, seek, settings)
                    break
                case "vlc":
                    res = await _vlc_openVideo(path, seek, settings)
                    break
            }
            !muteAlert && this._onError(res)
            return res?.data !== undefined ? res.data : false
        },
        async getPlaybackStatus() {
            let res
            switch (settings.player.defaultPlayer) {
                case "mpc-hc":
                    res = await _mpc_getPlaybackStatus(settings)
                    break
                case "vlc":
                    res = await _vlc_getPlaybackStatus(settings)
                    break
            }
            // this._onError(res)
            return res?.data
        },
        _onError(result: VideoPlayerRepositoryApiCallResult<any>) {
            if (result?.error) {
                toast.error(result.error)
                toast.error("Verify player is running and settings are correct.")
            }
        },
    }

}

export type VideoPlayerRepository = typeof VideoPlayerRepository
