import { openVideoWithMpc } from "@/lib/video-player/mpc-hc/controls"
import { openVideoWithVlc } from "@/lib/video-player/vlc/controls"
import { runCommand } from "@/lib/child-process"
import { Settings } from "@/atoms/settings"

export const enum SupportedVideoPlayers {
    "mpc-hc" = "mpc-hc",
    "vlc" = "vlc"
}

export type SupportedVideoPlayer = keyof typeof SupportedVideoPlayers

export const VideoPlayer = (settings: Settings) => {

    return {
        start: () => {
            const location = settings.player[settings.player.defaultPlayer]
            if (location.length > 0)
                runCommand(`"${location}"`)
        },
        openVideo: async (path: string) => {
            switch (settings.player.defaultPlayer) {
                case "mpc-hc":
                    return openVideoWithMpc(path)
                case "vlc":
                    return openVideoWithVlc(path)
            }
        },
    }

}
