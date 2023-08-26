"use server"

import { MpcApi } from "./api"
import { Settings } from "@/atoms/settings"

const mpcApi = new MpcApi("127.0.0.1", 13579)

function refresh(settings: Settings) {
    mpcApi.host = settings.player.host
    mpcApi.port = settings.player.mpcPort
}

export async function _mpc_openVideo(path: string, settings: Settings) {

    refresh(settings)

    try {
        await mpcApi.openFile(path)

        if (settings.player.pauseAfterOpening) {
            setTimeout(() => {
                mpcApi.pause()
            }, 500)
        }
    } catch (e) {
        return { error: "Could not open video" }
    }
}
