"use server"
import { QBittorrent } from "@ctrl/qbittorrent"
import { Settings } from "@/atoms/settings"

/* -------------------------------------------------------------------------------------------------
 * Config
 * -----------------------------------------------------------------------------------------------*/

const client = new QBittorrent({
    baseUrl: "http://localhost:8081/",
    username: "admin",
    password: "adminadmin",
})

function refresh(settings: Settings) {
    client.config.baseUrl = "http://" + settings.qbittorrent.host + ":" + settings.qbittorrent.port
    client.config.username = settings.qbittorrent.username
    client.config.password = settings.qbittorrent.password
}

/* -------------------------------------------------------------------------------------------------
 * Get all torrents
 * -----------------------------------------------------------------------------------------------*/

export async function _qBit_getAllTorrents(settings: Settings) {
    refresh(settings)
    return await client.getAllData()
}

/* -------------------------------------------------------------------------------------------------
 * Add magnet
 * -----------------------------------------------------------------------------------------------*/

export type TorrentManager_AddMagnetOptions = {
    magnets: string[],
    savePath: string
}

export async function _qBit_addMagnet(settings: Settings, options: TorrentManager_AddMagnetOptions) {
    refresh(settings)
    return await client.addMagnet(
        options.magnets.join("\n"),
        {
            savepath: options.savePath,
        },
    )
}


// Future<List<Torrent>> getTorrents();
//
// Future<Torrent> addTorrent(String magnet);
//
// Future<bool> stopTorrent(Torrent torrent);
//
// Future<bool> startTorrent(Torrent torrent);
//
// Future<bool> removeTorrent(Torrent torrent, [bool deleteLocal = false]);
//
// Future<bool> streamTorrent(Torrent torrent);
