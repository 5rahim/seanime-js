import { Settings } from "@/atoms/settings"
import {
    _qBit_addMagnet,
    _qBit_getAllTorrents,
    _qBit_getDownloadingTorrents,
    _qBit_getTorrent,
    _qBit_getTorrentContent,
    _qBit_isUp,
    _qBit_pauseTorrent,
    _qBit_setFilePriority,
    _qBit_startTorrent,
    TorrentManager_AddMagnetOptions,
    TorrentManager_SetFilePriorityOptions,
} from "@/lib/download/qbittorrent/api"
import toast from "react-hot-toast"
import { Nullish } from "@/types/common"
import { openDirectoryInExplorer } from "@/lib/helpers/directory"

export const TorrentRepository = (settings: Settings) => {

    return {
        async kickstart() {
            try {
                const isUp = await _qBit_isUp(settings)
                if (!isUp) {
                    await openDirectoryInExplorer(settings.qbittorrent.path || `C:\\Program Files\\qBittorrent\\qbittorrent.exe`)
                }
            } catch (e) {

            }
        },
        async getAllTorrents() {
            try {
                return await _qBit_getAllTorrents(settings)
            } catch (e) {
                this._connectionRefused()
            }
        },
        async getDownloadingTorrents() {
            try {
                return await _qBit_getDownloadingTorrents(settings)
            } catch (e) {
                return null
            }
        },
        async addMagnets(options: TorrentManager_AddMagnetOptions) {
            try {
                await _qBit_addMagnet(settings, options)
                return true
            } catch (e) {
                this._connectionRefused()
                return false
            }
        },
        async getTorrentContent(hash: Nullish<string>) {
            if (!hash) {
                this._error("Could not get torrent hash")
                return undefined
            }
            try {
                return { hash, content: await _qBit_getTorrentContent(settings, hash) }
            } catch (e) {
                this._error("Unable to get torrent files")
            }
        },
        async getTorrent(hash: Nullish<string>) {
            if (!hash) {
                this._error("Could not get torrent hash")
                return undefined
            }
            try {
                return await _qBit_getTorrent(settings, hash)
            } catch (e) {
                this._error("Unable to get torrent")
            }
        },
        async pauseTorrent(hash: Nullish<string>) {
            if (!hash) {
                this._error("Could not get torrent hash")
                return undefined
            }
            try {
                return await _qBit_pauseTorrent(settings, hash)
            } catch (e) {
                this._error("Unable to get pause torrent")
                return false
            }
        },
        async startTorrent(hash: Nullish<string>) {
            if (!hash) {
                this._error("Could not get torrent hash")
                return undefined
            }
            try {
                return await _qBit_startTorrent(settings, hash)
            } catch (e) {
                this._error("Unable to get start torrent")
                return false
            }
        },
        async setFilePriority(hash: Nullish<string>, options: TorrentManager_SetFilePriorityOptions) {
            if (!hash) {
                this._error("Could not get torrent hash")
                return undefined
            }
            try {
                return await _qBit_setFilePriority(settings, hash, options)
            } catch (e) {
                this._error("Unable to change file priority")
                return false
            }
        },
        readableState(state: string) {
            if (state === "stalledUP") return "Seeding"
            if (state === "uploading") return "Seeding"
            if (state === "stalledDL") return "Stalled"
            if (state === "allocating") return "Allocating"
            if (state === "downloading") return "Downloading"
            if (state === "metaDL") return "Downloading meta"
            if (state === "pausedDL") return "Paused"
            if (state === "queuedDL") return "Queued"
            if (state === "checkingDL") return "Checking"
            if (state === "forcedDL") return "Downloading"
            if (state === "queuedUP") return "Queued uploading"
            return state
        },
        _connectionRefused() {
            toast.error("An error occurred.")
        },
        _error(msg: string) {
            toast.error(msg)
        },
    }

}

export type TorrentRepositoryObject = ReturnType<typeof TorrentRepository>