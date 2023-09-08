import { Settings } from "@/atoms/settings"
import {
    _qBit_addMagnet,
    _qBit_getAllTorrents,
    _qBit_getTorrent,
    _qBit_getTorrentContent,
    _qBit_pauseTorrent,
    _qBit_refreshSettings,
    _qBit_setFilePriority,
    _qBit_startTorrent,
    TorrentManager_AddMagnetOptions,
    TorrentManager_SetFilePriorityOptions,
} from "@/lib/download/qbittorrent/api"
import toast from "react-hot-toast"
import { Nullish } from "@/types/common"

export const TorrentManager = (settings: Settings) => {

    return {
        async getAllTorrents() {
            this._refreshSettings()
            try {
                return await _qBit_getAllTorrents()
            } catch (e) {
                this._connectionRefused()
            }
        },
        async addMagnets(options: TorrentManager_AddMagnetOptions) {
            this._refreshSettings()
            try {
                await _qBit_addMagnet(options)
            } catch (e) {
                this._connectionRefused()
            }
        },
        async getTorrentContent(hash: Nullish<string>) {
            this._refreshSettings()
            if (!hash) {
                this._error("Could not get torrent hash")
                return undefined
            }
            try {
                return { hash, content: await _qBit_getTorrentContent(hash) }
            } catch (e) {
                console.log(e)
                this._error("Unable to get torrent files")
            }
        },
        async getTorrent(hash: Nullish<string>) {
            this._refreshSettings()
            if (!hash) {
                this._error("Could not get torrent hash")
                return undefined
            }
            try {
                return await _qBit_getTorrent(hash)
            } catch (e) {
                console.log(e)
                this._error("Unable to get torrent")
            }
        },
        async pauseTorrent(hash: Nullish<string>) {
            this._refreshSettings()
            if (!hash) {
                this._error("Could not get torrent hash")
                return undefined
            }
            try {
                return await _qBit_pauseTorrent(hash)
            } catch (e) {
                console.log(e)
                this._error("Unable to get pause torrent")
                return false
            }
        },
        async startTorrent(hash: Nullish<string>) {
            this._refreshSettings()
            if (!hash) {
                this._error("Could not get torrent hash")
                return undefined
            }
            try {
                return await _qBit_startTorrent(hash)
            } catch (e) {
                console.log(e)
                this._error("Unable to get start torrent")
                return false
            }
        },
        async setFilePriority(hash: Nullish<string>, options: TorrentManager_SetFilePriorityOptions) {
            this._refreshSettings()
            if (!hash) {
                this._error("Could not get torrent hash")
                return undefined
            }
            try {
                return await _qBit_setFilePriority(settings, hash, options)
            } catch (e) {
                console.log(e)
                this._error("Unable to change file priority")
                return false
            }
        },
        _connectionRefused() {
            toast.error("An error occurred.")
        },
        _error(msg: string) {
            toast.error(msg)
        },
        _refreshSettings() {
            _qBit_refreshSettings(settings)
        },
    }

}
