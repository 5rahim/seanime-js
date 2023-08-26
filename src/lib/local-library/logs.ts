import path from "path"
import { existsSync, promises as fs } from "fs"

export class ScanLogging {

    private _scanLogs

    constructor() {
        // Key: file path, value: logs
        this._scanLogs = new Map<string, { log: string, timestamp: number }[]>()
    }

    add(path: string, log: string) {
        if (this._scanLogs.has(path)) {
            this._scanLogs.set(path, [...this._scanLogs.get(path)!, { log, timestamp: (new Date()).getTime() }])
        } else {
            this._scanLogs.set(path, [{ log, timestamp: (new Date()).getTime() }])
        }
    }

    clear() {
        this._scanLogs.clear()
    }

    output() {
        let _output = ""
        for (const [key, value] of this._scanLogs) {
            _output += `\n>>> ${key}\n`
            value.forEach(obj => {
                _output += `[${obj.timestamp}] ${obj.log}\n`
            })
        }
        return _output
    }

    async writeSnapshot() {
        const snapshotDir = path.resolve("snapshot")
        if (!existsSync(snapshotDir)) {
            await fs.mkdir(snapshotDir)
        }
        // Generate the timestamp for the snapshot file name
        const timestamp = new Date().toISOString().replace(/:/g, "-")
        const snapshotFilename = `scan_${timestamp}.txt`
        const snapshotPath = path.join(snapshotDir, snapshotFilename)

        await fs.writeFile(snapshotPath, this.output(), { encoding: "utf-8" })
    }

}
