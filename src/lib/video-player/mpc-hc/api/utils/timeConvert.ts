import padStart from "lodash/padStart"

export function millisecondsToDuration(ms: number): string {
    if (ms <= 0) {
        return "00:00:00"
    }

    let duration = Math.floor(ms / 1000)
    const hours = Math.floor(duration / 3600)
    duration = duration % 3600

    const minutes = Math.floor(duration / 60)
    duration = duration % 60

    return padStart(hours.toString(), 2, "0") + ":" + padStart(minutes.toString(), 2, "0") + ":" + padStart(duration.toString(), 2, "0")
}
