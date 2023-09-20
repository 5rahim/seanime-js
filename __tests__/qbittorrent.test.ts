import { initialSettings } from "@/atoms/settings"
import { describe } from "vitest"

const settings = {
    ...initialSettings,
    library: {
        localDirectory: "E:/ANIME",
    },
}

describe.skip("Experimental qBittorrent API", () => {

})
//
//     test.skip("torrent data", async () => {
//         const torrent = await _qBit_getTorrent(settings, "2dc4ed060501d60a166ddc32ae4dec9c160ea4c0")
//         const torrent2 = await LEGACY_qBit_getTorrent("2dc4ed060501d60a166ddc32ae4dec9c160ea4c0")
//         expect(torrent).toEqual(torrent2)
//     })
//
//     test.skip("torrent files", async () => {
//         const files = await _qBit_getTorrentContent(settings, "d301832a07da24c21955d6319df28799f92c0bcb")
//         const files2 = await LEGACY_qBit_getTorrentContent("d301832a07da24c21955d6319df28799f92c0bcb")
//         expect(files).toEqual(files2)
//     })
//
//     test.skip("all torrents", async () => {
//         const torrents = await _qBit_getAllTorrents(settings)
//         const torrents2 = await LEGACY_qBit_getAllTorrents()
//         expect(torrents).toEqual(torrents2)
//     })
//
//     test.skip("add torrent", async () => {
//         const res = await _qBit_addMagnet(settings, {
//             magnets: ["magnet:?xt=urn:btih:bfbef097d85fe095e071e05cb4c89d1d010e0f7e&dn=%5BTrix%5D%20Bungou%20Stray%20Dogs%20S05E11%20%28720p%20AV1%29%20%5BMulti%20Subs%5D%20%20%28EN%7CPT-BR%7CES-LA%7CES%7CAR%7CFR%7CDE%7CIT%7CRU%29%20-%20Bungo%205th%20Season%20%28VOSTFR%29%20%28Weekly%29&tr=http%3A%2F%2Fnyaa.tracker.wf%3A7777%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce"],
//             savePath: "E:/ANIME",
//             paused: true
//         })
//         expect(res).toEqual("Ok.")
//     })
//
//     it.skip("should return false", async () => {
//         const res = await _qBit_isUp(settings)
//         expect(res).toEqual(false)
//     })
// })
