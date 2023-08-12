import { openVideoWithMpc } from "@/lib/video-player/mpc-hc/controls"
import { openVideoWithVlc } from "@/lib/video-player/vlc/controls"
import { runCommand } from "@/lib/child-process"
import { Settings } from "@/atoms/settings"
import toast from "react-hot-toast"

export const enum SupportedVideoPlayers {
    "mpc-hc" = "mpc-hc",
    "vlc" = "vlc"
}

export type SupportedVideoPlayer = keyof typeof SupportedVideoPlayers

export const VideoPlayer = (settings: Settings) => {

    return {
        start: async () => {
            const location = settings.player[settings.player.defaultPlayer]
            try {
                if (location.length > 0)
                    await runCommand(`"${location}"`)
            } catch (e) {
                toast.error("Could not open the player")
            }
        },
        openVideo: async (path: string) => {
            // const loading = toast.loading("Opening")
            let res: any
            try {
                switch (settings.player.defaultPlayer) {
                    case "mpc-hc":
                        res = await openVideoWithMpc(path, settings)
                        break
                    case "vlc":
                        res = await openVideoWithVlc(path, settings)
                        break
                }
                if (res?.error) toast.error("Could not open video. Verify player is running and settings are correct.")
                // setTimeout(() => {
                //     toast.remove(loading)
                // }, 1000)
            } catch (e) {

            }
        },
    }

}
