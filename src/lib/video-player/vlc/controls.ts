"use server"

import { VLC } from "@/lib/video-player/vlc/commands"

const vlc = new VLC({
    host: "127.0.0.1",
    port: 8080,
    username: "",
    password: "seanime",
    // update automatically status and playlist of VLC, default true.
    autoUpdate: true,
    // how many times per seconds (in ms) node-vlc-http will update the status of VLC, default 1000/30 ~ 33ms (30fps)
    tickLengthMs: 1000,
    // checks that browse, status and playlist have changed since the last update of one of its elements,
    // if it the case fire browsechange, statuschange or playlistchange event. default true.
    changeEvents: true,
    // max tries at the first connection before throwing an error set it to -1 for infinite try, default 3
    maxTries: 3,
    // interval between each try in ms, default 1000
    triesInterval: 1000,
})

export async function openVideoWithVlc(path: string, options?: { pauseOnOpen?: boolean }) {

    const pauseOnOpen = options?.pauseOnOpen ?? true

    await vlc.addToQueueAndPlay(path)

    if (pauseOnOpen) {
        setTimeout(() => {
            vlc.forcePause()
        }, 500)
    }
}

export function startMpc() {
    require("child_process").exec(`"C:\\Program Files\\VideoLAN\\VLC"`)
}
