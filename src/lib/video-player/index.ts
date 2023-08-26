import { _mpc_openVideo } from "@/lib/video-player/mpc-hc/controls"
import { _vlc_openVideo } from "@/lib/video-player/vlc/controls"
import { runCommand } from "@/lib/helpers/child-process"
import { Settings } from "@/atoms/settings"
import toast from "react-hot-toast"

export const enum SupportedVideoPlayers {
    "mpc-hc" = "mpc-hc",
    "vlc" = "vlc"
}

export type SupportedVideoPlayer = keyof typeof SupportedVideoPlayers

export const VideoPlayer = (settings: Settings) => {

    let tries = 0

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
        async openVideo(path: string) {
            let res: any
            try {
                switch (settings.player.defaultPlayer) {
                    case "mpc-hc":
                        res = await _mpc_openVideo(path, settings)
                        break
                    case "vlc":
                        res = await _vlc_openVideo(path, settings)
                        break
                }
                if (res?.error) {
                    toast.error("Could not open video. Verify player is running and settings are correct.")
                }
            } catch (e) {

            }
        },
    }

}

export type VideoPlayer = typeof VideoPlayer
