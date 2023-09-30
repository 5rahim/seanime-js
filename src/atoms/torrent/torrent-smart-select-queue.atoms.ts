import { atomWithStorage } from "jotai/utils"
import { withImmer } from "jotai-immer"
import { useSetAtom } from "jotai/react"
import { SearchTorrentData } from "@/lib/download/types"
import { MediaDownloadInfo } from "@/lib/download/helpers"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"

/* -------------------------------------------------------------------------------------------------
 * Store torrent batches that are paused, so they can be processed and un-paused
 * -----------------------------------------------------------------------------------------------*/

type TorrentQueueItemState = "awaiting_meta" | "ready"

export type TorrentQueueItem = {
    torrent: SearchTorrentData,
    downloadInfo: MediaDownloadInfo,
    media: AnilistDetailedMedia,
    episodeOffset: number,
    status: TorrentQueueItemState
}

export const _torrentSmartSelectQueueAtom = atomWithStorage<TorrentQueueItem[]>("sea-torrent-smart-select-queue", [], undefined, { unstable_getOnInit: true })

export const torrentSmartSelectQueueAtom = withImmer(_torrentSmartSelectQueueAtom)

export function useTorrentSmartSelectQueue() {
    const setter = useSetAtom(torrentSmartSelectQueueAtom)

    return {
        emptyQueue: () => setter(draft => []),
        addTorrentToQueue: (props: Omit<TorrentQueueItem, "status">) => {
            setter(draft => {
                draft.push({
                    ...props,
                    status: "awaiting_meta",
                })
                return
            })
        },
        updateTorrentStatus: (hash: string, status: TorrentQueueItemState) => {
            setter(draft => {
                const idx = draft.findIndex(item => item.torrent.hash === hash)
                if (idx !== -1) {
                    draft[idx].status = status
                }
                return
            })
        },
        deleteTorrentFromQueue: (hash: string) => {
            setter(draft => {
                return draft.filter(item => item.torrent.hash !== hash)
            })
        },
    }
}
