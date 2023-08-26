"use server"

import { VlcApi } from "@/lib/video-player/vlc/api"
import { Settings } from "@/atoms/settings"

const vlc = new VlcApi({
    host: "127.0.0.1",
    port: 8080,
    username: "",
    password: "seanime",
    // update automatically status and playlist of VLC, default true.
    autoUpdate: false, // FIXME Causes unhandled promise rejection errors when player is closed
    // how many times per seconds (in ms) node-vlc-http will update the status of VLC, default 1000/30 ~ 33ms (30fps)
    tickLengthMs: 1000,
    // checks that browse, status and playlist have changed since the last update of one of its elements,
    // if it is the case fire browsechange, statuschange or playlistchange event. default true.
    changeEvents: true,
    // max tries at the first connection before throwing an error set it to -1 for infinite try, default 3
    maxTries: 2,
    // interval between each try in ms, default 1000
    triesInterval: 1000,
})

function refresh(settings: Settings) {
    vlc.host = settings.player.host
    vlc.port = settings.player.vlcPort
    vlc.authorization = `Basic ${Buffer.from(
        `${settings.player.vlcUsername}:${settings.player.vlcPassword}`,
    ).toString("base64")}`
}

export async function _vlc_openVideo(path: string, settings: Settings) {

    refresh(settings)

    try {
        await vlc.addToQueueAndPlay(path)

        if (settings.player.pauseAfterOpening) {
            setTimeout(() => {
                vlc.forcePause()
            }, 500)
        }
    } catch (e) {
        return { error: "Could not open video" }
    }
}
