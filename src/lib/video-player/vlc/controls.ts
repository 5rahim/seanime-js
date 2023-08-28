"use server"

import { VlcApi } from "@/lib/video-player/vlc/api"
import { Settings } from "@/atoms/settings"
import { VideoPlayerRepositoryApiCallResult, VideoPlayerRepositoryPlaybackStatus } from "@/lib/video-player/types"
import { Nullish } from "@/types/common"

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

/* -------------------------------------------------------------------------------------------------
 * Open a video
 * -----------------------------------------------------------------------------------------------*/

export async function _vlc_openVideo(path: string, seek: Nullish<number>, settings: Settings): Promise<VideoPlayerRepositoryApiCallResult<boolean>> {
    refresh(settings)

    try {
        const res = await vlc.addToQueueAndPlay(path)

        if (settings.player.pauseAfterOpening) {
            setTimeout(() => {
                vlc.forcePause()
            }, 600)
        }

        return { data: true }
    } catch (e) {
        return { data: false, error: "Could not open video." }
    }
}


/* -------------------------------------------------------------------------------------------------
 * Experimental
 * -----------------------------------------------------------------------------------------------*/

export async function _vlc_getPlaybackStatus(settings: Settings): Promise<VideoPlayerRepositoryApiCallResult<VideoPlayerRepositoryPlaybackStatus>> {
    refresh(settings)

    try {
        const status = await vlc.getStatus()

        return {
            data: {
                completionPercentage: Number(status.position.toFixed(2)),
                fileName: status.information.category.meta.filename,
                state: status.state,
                duration: status.length * 1000, // Convert to ms
            },
        }
    } catch (e) {
        return { error: "Could not open video." }
    }
}
