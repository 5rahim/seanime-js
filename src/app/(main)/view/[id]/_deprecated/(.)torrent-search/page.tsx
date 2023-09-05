import React from "react"
import { DownloadModal } from "@/app/(main)/view/[id]/_deprecated/(.)torrent-search/modal"
import { TorrentSearchModal } from "@/app/(main)/view/_containers/torrent-search/torrent-search-modal"

export default async function Page({ params }: { params: { id: string } }) {

    return (
        <>
            <DownloadModal>
                <TorrentSearchModal
                    mediaId={Number(params.id)}
                />
            </DownloadModal>
        </>
    )
}
