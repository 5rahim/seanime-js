"use server"

import { MpcControl } from "./api"

const mpcApi = new MpcControl("127.0.0.1", 13579)

export async function openVideoWithMpc(path: string, options?: { pauseOnOpen?: boolean }) {

    const pauseOnOpen = options?.pauseOnOpen ?? true

    await mpcApi.openFile(path)

    if (pauseOnOpen) {
        setTimeout(() => {
            mpcApi.pause()
        }, 500)
    }
}

export function startMpc() {
    require("child_process").exec(`"C:\\Program Files\\MPC-HC\\mpc-hc64.exe"`)
}
