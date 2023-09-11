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

export async function _qBit_isUp() {
    try {
        await client.getAppVersion()
        return true
    } catch (e) {
        return false
    }
}

/* -------------------------------------------------------------------------------------------------
 * Get all torrents
 * -----------------------------------------------------------------------------------------------*/

export type TorrentManager_Torrent = {
    id: string,
    name: string,
    eta: number,
    isCompleted: boolean,
    savePath: string,
    downloadSpeed: number,
    uploadSpeed: number,
    size: number,
    peers: number,
    seeds: number,
    dateAdded: Date,
    state: string,
    hash: string,
    progress: number,
}

export async function _qBit_getAllTorrents(): Promise<TorrentManager_Torrent[] | undefined> {
    const data = await client.getAllData()
    return data?.torrents?.map(item => ({
        id: item.id,
        name: item.name,
        eta: item.eta,
        isCompleted: item.isCompleted,
        savePath: item.savePath,
        downloadSpeed: item.downloadSpeed,
        uploadSpeed: item.uploadSpeed,
        size: item.totalSize,
        peers: item.totalPeers,
        seeds: item.totalSeeds,
        dateAdded: new Date(item.dateAdded),
        state: item.raw?.state,
        hash: item.raw?.hash,
        progress: item.progress,
    })).sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime())
}

export async function _qBit_getDownloadingTorrents(): Promise<TorrentManager_Torrent[] | undefined> {
    return (await _qBit_getAllTorrents())?.filter(torrent => torrent.state === "stalledUP"
        || torrent.state === "allocating"
        || torrent.state === "downloading"
        || torrent.state === "metaDL"
        || torrent.state === "pausedDL"
        || torrent.state === "queuedDL"
        || torrent.state === "checkingDL"
        || torrent.state === "forcedDL"
        || torrent.state === "uploading"
        || torrent.state === "stalledDL"
        || torrent.state === "queuedUP",
    )
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
