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

export async function _qBit_refreshSettings(settings: Settings) {
    client.config.baseUrl = "http://" + settings.qbittorrent.host + ":" + settings.qbittorrent.port
    client.config.username = settings.qbittorrent.username
    client.config.password = settings.qbittorrent.password
}

export async function _qBit_getClient() {
    return {
        getAllData: client.getAllData,
        addMagnet: client.addMagnet,
        pauseTorrent: client.pauseTorrent,
    }
}

/* -------------------------------------------------------------------------------------------------
 * Get all torrents
 * -----------------------------------------------------------------------------------------------*/

export async function _qBit_getAllTorrents(settings: Settings) {
    await _qBit_refreshSettings(settings)
    return await client.getAllData()
}

export async function _qBit_getTorrentContents(settings: Settings, hash: string) {
    await _qBit_refreshSettings(settings)
    return await client.getTorrent(hash)
}

/* -------------------------------------------------------------------------------------------------
 * Add magnet
 * -----------------------------------------------------------------------------------------------*/

export type TorrentManager_AddMagnetOptions = {
    magnets: string[],
    savePath: string
}

export async function _qBit_addMagnet(settings: Settings, options: TorrentManager_AddMagnetOptions) {
    await _qBit_refreshSettings(settings)
    return await client.addMagnet(
        options.magnets.join("\n"),
        {
            savepath: options.savePath,
        },
    )
}

/* -------------------------------------------------------------------------------------------------
 * Stop torrent
 * -----------------------------------------------------------------------------------------------*/

export type TorrentManager_StopTorrentOptions = {
    hashes: string[] | "all",
}

export async function _qBit_stopTorrent(settings: Settings, options: TorrentManager_StopTorrentOptions) {
    await _qBit_refreshSettings(settings)
    return await client.pauseTorrent(options.hashes)
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
