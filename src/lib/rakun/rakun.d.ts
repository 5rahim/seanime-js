interface ParsedTorrentInfo {
    // Original filename
    readonly filename: string
    // Cleaned name
    readonly name: string
    readonly hash?: string
    readonly extension?: string
    readonly resolution?: string
    //Source (Blu-ray, DVD, etc.)
    readonly source?: string
    readonly codecs?: string
    readonly audio?: string
    readonly subtitles?: string
    readonly releaseGroup?: string
    readonly website?: string
    //Content producer/distributor
    readonly distributor?: string
    //Torrent other metadata (repack, etc.)
    readonly meta?: string
    readonly movie?: string
    readonly season?: string
    readonly part?: string
    readonly episode?: string
    readonly cour?: string
    readonly episodeRange?: string
    readonly seasonRange?: string
    readonly episodeTitle?: string
}

type TorrentParserData = {
    // Reference
    readonly result: RakunRecordAny
    // Cleaned string
    cleaned: string
    // Regex matches to remove
    readonly removes: RegExp[]
    // Rejected matches to re-add
    readonly rejects: string[]
    // Regexes collections
    readonly regexes: Regexs
    // Options
    readonly options: RakunParserOptions
}

type RakunParserOptions = {}

type RakunRecordAny = { [key: string]: any }

/** Filter overload. */
interface Array<T> {
    filter<U extends T>(pred: (a: T) => a is U): U[]
}
