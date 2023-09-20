import path from "path"
import { existsSync, promises as fs } from "fs"
import { logger } from "@/lib/helpers/debug"

export class ScanLogging {

    private readonly _scanLogs

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

    addAndLog(key: string, type: "info" | "warning", path: string, log: string) {
        if (this._scanLogs.has(path)) {
            this._scanLogs.set(path, [...this._scanLogs.get(path)!, { log, timestamp: (new Date()).getTime() }])
        } else {
            this._scanLogs.set(path, [{ log, timestamp: (new Date()).getTime() }])
        }
        if (type === "info")
            logger(key).info(path, log)
        if (type === "warning")
            logger(key).warning(path, log)
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

    outputWithTime() {
        let _output = ""
        for (const [key, value] of this._scanLogs) {
            let previousTimestamp = (new Date()).getTime()
            _output += `\n>>> ${key}\n`
            value.forEach(obj => {
                const waitTime = (obj.timestamp - previousTimestamp)
                if (waitTime > 0) {
                    _output += `waited ${(obj.timestamp - previousTimestamp)}ms\n`
                }
                _output += `[${new Date(obj.timestamp).toISOString()}] ${obj.log}\n`
                previousTimestamp = obj.timestamp
            })
        }
        return _output
    }

    async writeSnapshot() {
        const snapshotDir = path.resolve("logs")
        if (!existsSync(snapshotDir)) {
            await fs.mkdir(snapshotDir)
        }
        // Generate the timestamp for the snapshot file name
        const timestamp = new Date().toISOString().replace(/:/g, "_")
        const snapshotFilename = `${timestamp.replaceAll(".", "_")}-scan.txt`
        const snapshotPath = path.join(snapshotDir, snapshotFilename)

        await fs.writeFile(snapshotPath, this.outputWithTime(), { encoding: "utf-8" })
    }

}
