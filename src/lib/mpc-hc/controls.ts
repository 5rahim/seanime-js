"use server"

import { MpcControl } from "./api"

const mpcApi = new MpcControl("127.0.0.1", 13579)

export async function testMPC() {

    await mpcApi.openFile("E:\\ANIME\\[EMBER] Kaguya-sama wa Kokurasetai - First Kiss wa Owaranai (Movie) [1080p] [HEVC WEBRip].mkv")
}

export async function startMpc() {
    require("child_process").exec(`"C:\\Program Files\\MPC-HC\\mpc-hc64.exe"`)
}

// mpcApi.setVolume(75)
