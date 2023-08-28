import { Settings } from "@/atoms/settings"
import {
    _qBit_addMagnet,
    _qBit_getAllTorrents,
    _qBit_refreshSettings,
    TorrentManager_AddMagnetOptions,
} from "@/lib/download/qbittorrent/api"
import toast from "react-hot-toast"

export const TorrentManager = (settings: Settings) => {

    return {
        async getAllTorrents() {
            this._refreshSettings()
            try {
                return await _qBit_getAllTorrents(settings)
            } catch (e) {
                this._connectionRefused()
            }
        },
        async addMagnets(options: TorrentManager_AddMagnetOptions) {
            this._refreshSettings()
            try {
                await _qBit_addMagnet(settings, options)
            } catch (e) {
                this._connectionRefused()
            }
        },
        _connectionRefused() {
            // TODO: Listen to error being thrown and change message accordingly
            toast.error("Connection refused. Verify your qBittorent settings.")
        },
        _refreshSettings() {
            _qBit_refreshSettings(settings)
        },
    }

}
