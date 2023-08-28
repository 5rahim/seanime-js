"use server"

import { MpcApi } from "./api"
import { Settings } from "@/atoms/settings"
import {
    VideoPlayerRepositoryApiCallResult,
    VideoPlayerRepositoryPlaybackState,
    VideoPlayerRepositoryPlaybackStatus,
} from "@/lib/video-player/types"
import { Nullish } from "@/types/common"

const mpcApi = new MpcApi("127.0.0.1", 13579)

function refresh(settings: Settings) {
    mpcApi.host = settings.player.host
    mpcApi.port = settings.player.mpcPort
}

/* -------------------------------------------------------------------------------------------------
 * Open a video
 * -----------------------------------------------------------------------------------------------*/

export async function _mpc_openVideo(path: string, seek: Nullish<number>, settings: Settings): Promise<VideoPlayerRepositoryApiCallResult<boolean>> {
    refresh(settings)

    try {
        await mpcApi.openFile(path)

        if (settings.player.pauseAfterOpening) {
            setTimeout(() => {
                mpcApi.togglePlay()
            }, 2000)
        }

        return { data: true }
    } catch (e) {
        return { data: false, error: "Could not open video." }
    }
}


/* -------------------------------------------------------------------------------------------------
 * Experimental
 * -----------------------------------------------------------------------------------------------*/

export async function _mpc_getPlaybackStatus(settings: Settings): Promise<VideoPlayerRepositoryApiCallResult<VideoPlayerRepositoryPlaybackStatus>> {
    refresh(settings)

    try {
        const playbackStatus = await mpcApi.getPlaybackStats()

        return {
            data: {
                completionPercentage: Number((playbackStatus.position / playbackStatus.duration).toFixed(2)),
                state: playbackStatus.state.toLowerCase() as VideoPlayerRepositoryPlaybackState,
                fileName: playbackStatus.fileName,
                duration: playbackStatus.duration,
            },
        }
    } catch (e) {
        return { error: "Could not get status." }
    }
}
