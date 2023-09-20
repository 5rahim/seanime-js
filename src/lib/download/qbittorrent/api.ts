"use server"
import { Settings } from "@/atoms/settings"
import { Nullish } from "@/types/common"
import { qBittorrentClient } from "@robertklep/qbittorrent"
import { NormalizedTorrent, Torrent, TorrentFile, TorrentFilePriority } from "@/lib/download/qbittorrent/types"
import { _normalizeTorrentData } from "@/lib/download/qbittorrent/utils"

/* -------------------------------------------------------------------------------------------------
 * Config
 * -----------------------------------------------------------------------------------------------*/

export async function _qBit_isUp(settings: Settings) {
    const client2 = new qBittorrentClient("http://" + settings.qbittorrent.host + ":" + settings.qbittorrent.port, settings.qbittorrent.username, settings.qbittorrent.password)
    try {
        await client2.app.version()
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


export async function _qBit_getAllTorrents(settings: Settings): Promise<TorrentManager_Torrent[] | undefined> {
    const client2 = new qBittorrentClient("http://" + settings.qbittorrent.host + ":" + settings.qbittorrent.port, settings.qbittorrent.username, settings.qbittorrent.password)

    const torrents = (await client2.torrents.info({ filter: "all" })) as Torrent[]
    return !!torrents ? torrents.map(torrent => {
        let item = _normalizeTorrentData(torrent)
        return ({
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
        })
    }).sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime()) : undefined
}


export async function _qBit_getDownloadingTorrents(settings: Settings): Promise<TorrentManager_Torrent[] | undefined> {
    return (await _qBit_getAllTorrents(settings))?.filter(torrent => torrent.state === "stalledUP"
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

export async function _qBit_addMagnet(settings: Settings, options: TorrentManager_AddMagnetOptions) {
    const client2 = new qBittorrentClient("http://" + settings.qbittorrent.host + ":" + settings.qbittorrent.port, settings.qbittorrent.username, settings.qbittorrent.password)
    // @ts-ignore
    return await client2.torrents.add({
        urls: options.magnets,
        savepath: options.savePath,
        paused: options.paused,
    })
}

/* -------------------------------------------------------------------------------------------------
 *
 * -----------------------------------------------------------------------------------------------*/


export async function _qBit_getTorrentContent(settings: Settings, hash: Nullish<string>) {
    const client2 = new qBittorrentClient("http://" + settings.qbittorrent.host + ":" + settings.qbittorrent.port, settings.qbittorrent.username, settings.qbittorrent.password)
    if (!hash)
        return undefined

    return (await client2.torrents.files(hash)) as TorrentFile[] | undefined
}

/* -------------------------------------------------------------------------------------------------
 *
 * -----------------------------------------------------------------------------------------------*/

export async function _qBit_getTorrent(settings: Settings, hash: Nullish<string>): Promise<NormalizedTorrent | undefined> {
    const client2 = new qBittorrentClient("http://" + settings.qbittorrent.host + ":" + settings.qbittorrent.port, settings.qbittorrent.username, settings.qbittorrent.password)
    if (!hash)
        return undefined

    const torrent = (await client2.torrents.info({ hashes: hash }))?.[0] as Torrent
    return torrent ? _normalizeTorrentData(torrent) : undefined
}

/* -------------------------------------------------------------------------------------------------
 *
 * -----------------------------------------------------------------------------------------------*/

export async function _qBit_pauseTorrent(settings: Settings, hash: Nullish<string>) {
    const client2 = new qBittorrentClient("http://" + settings.qbittorrent.host + ":" + settings.qbittorrent.port, settings.qbittorrent.username, settings.qbittorrent.password)
    if (!hash)
        return false
    return await client2.torrents.pause(hash)
}

export async function _qBit_startTorrent(settings: Settings, hash: Nullish<string>) {
    const client2 = new qBittorrentClient("http://" + settings.qbittorrent.host + ":" + settings.qbittorrent.port, settings.qbittorrent.username, settings.qbittorrent.password)
    if (!hash)
        return false
    return await client2.torrents.resume(hash)
}

export type TorrentManager_SetFilePriorityOptions = {
    ids: string[], priority: TorrentFilePriority
}


export async function _qBit_setFilePriority(settings: Settings, hash: Nullish<string>, options: TorrentManager_SetFilePriorityOptions) {

    const client2 = new qBittorrentClient("http://" + settings.qbittorrent.host + ":" + settings.qbittorrent.port, settings.qbittorrent.username, settings.qbittorrent.password)

    if (!hash)
        return false

    return await client2.torrents.filePrio(hash, options.ids, options.priority)

}
