"use server"
import { QBittorrent, TorrentFilePriority } from "@ctrl/qbittorrent"
import { Settings } from "@/atoms/settings"
import { Nullish } from "@/types/common"

import { qBittorrentClient } from "@robertklep/qbittorrent"

/* -------------------------------------------------------------------------------------------------
 * Config
 * -----------------------------------------------------------------------------------------------*/

const client = new QBittorrent({
    baseUrl: "http://127.0.0.1:8081/",
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

export async function _qBit_getAllTorrents() {
    return await client.getAllData()
}

/* -------------------------------------------------------------------------------------------------
 * Add magnet
 * -----------------------------------------------------------------------------------------------*/

export type TorrentManager_AddMagnetOptions = {
    magnets: string[],
    savePath: string
    paused: boolean
}

export async function _qBit_addMagnet(options: TorrentManager_AddMagnetOptions) {
    return await client.addMagnet(
        options.magnets.join("\n"),
        {
            savepath: options.savePath,
            paused: options.paused ? "true" : "false",
        },
    )
}

/* -------------------------------------------------------------------------------------------------
 * Stop torrent
 * -----------------------------------------------------------------------------------------------*/

export type TorrentManager_StopTorrentOptions = {
    hashes: string[] | "all",
}

export async function _qBit_stopTorrent(options: TorrentManager_StopTorrentOptions) {
    return await client.pauseTorrent(options.hashes)
}

/* -------------------------------------------------------------------------------------------------
 *
 * -----------------------------------------------------------------------------------------------*/

export async function _qBit_getTorrentContent(hash: Nullish<string>) {
    if (!hash)
        return undefined

    return await client.torrentFiles(hash)
}

export async function _qBit_getTorrent(hash: Nullish<string>) {
    if (!hash)
        return undefined

    return await client.getTorrent(hash)
}

export async function _qBit_pauseTorrent(hash: Nullish<string>) {
    if (!hash)
        return false

    return await client.pauseTorrent(hash)
}

export async function _qBit_startTorrent(hash: Nullish<string>) {
    if (!hash)
        return false

    return await client.resumeTorrent(hash)
}

export type TorrentManager_SetFilePriorityOptions = {
    ids: string[], priority: TorrentFilePriority
}


export async function _qBit_setFilePriority(settings: Settings, hash: Nullish<string>, options: TorrentManager_SetFilePriorityOptions) {

    const client2 = new qBittorrentClient("http://" + settings.qbittorrent.host + ":" + settings.qbittorrent.port, settings.qbittorrent.username, settings.qbittorrent.password)

    if (!hash)
        return false

    // return await client.setFilePriority(hash, options.ids, options.priority) <- Doesn't work
    return await client2.torrents.filePrio(hash, options.ids, options.priority)

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
