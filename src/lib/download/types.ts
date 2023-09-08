import { SearchTorrent } from "@/lib/download/nyaa/api/types"

export type SearchTorrentData = SearchTorrent & { parsed: TorrentInfos, hash: string }
