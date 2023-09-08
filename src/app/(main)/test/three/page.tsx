"use client"

import React, { useRef } from "react"
import { useToggle, useUpdateEffect } from "react-use"
import { useSettings } from "@/atoms/settings"
import { TorrentManager } from "@/lib/download"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { useAtom } from "jotai/react"
import {
    torrentSmartSelectQueueAtom,
    useTorrentSmartSelectQueue,
} from "@/atoms/torrent/torrent-smart-select-queue.atoms"
import { isTorrentReady } from "@/lib/download/torrent-helpers"
import rakun from "@/lib/rakun/rakun"
import { valueContainsNC, valueContainsSpecials } from "@/lib/local-library/utils"
import path from "path"

export default function Page() {

    const { settings } = useSettings()

    const [fetchTorrent, toggleFetchTorrent] = useToggle(false)

    const [torrentQueue, setTorrentQueue] = useAtom(torrentSmartSelectQueueAtom)
    const { emptyQueue, updateTorrentStatus, deleteTorrentFromQueue } = useTorrentSmartSelectQueue()

    // useLogger("page")

    const torrentManager = useRef(TorrentManager(settings))

    // "9db6955fc09c1a79d6fbfa822894cc528b0c1e25"
    // useEffect(() => {
    //     (async () => {
    //         console.log(await torrentManager.current.getTorrentContent("4e0875df2c33f5b5bcf46da08472b8853defe58a"))
    //     })()
    // }, [])

    // 1. Torrent is paused and in queue
    // 2. Unpause torrent until it is ready
    // 3. Pause torrent, unselect un-used files
    // 4. Resume download

    const { data: torrentsInQueue } = useQuery({
        queryKey: ["test", torrentQueue],
        queryFn: async () => {
            const results = await Promise.allSettled(torrentQueue.filter(item => item.status === "awaiting_meta").map(item => (
                torrentManager.current.getTorrent(item.torrent.hash)
            )))
            return results.map(result => {
                if (result.status === "fulfilled" && !!result.value) {
                    return result.value
                }
            }).filter(Boolean)
        },
        refetchInterval: 1000,
        enabled: fetchTorrent && torrentQueue?.filter(item => item?.status === "awaiting_meta").length > 0,
        keepPreviousData: false,
    })

    const { data: torrentsWithContent } = useQuery({
        queryKey: ["test", torrentQueue, torrentsInQueue],
        queryFn: async () => {
            const results = await Promise.allSettled(torrentQueue.filter(item => item.status === "ready").map(item => (
                torrentManager.current.getTorrent(item.torrent.hash)
            )))
            const contentResults = await Promise.allSettled(torrentQueue.filter(item => item.status === "ready").map(item => (
                torrentManager.current.getTorrentContent(item.torrent.hash)
            )))
            const torrents = results.map(result => {
                if (result.status === "fulfilled" && !!result.value) {
                    return result.value
                }
            }).filter(Boolean)
            const contents = contentResults.map(result => {
                if (result.status === "fulfilled" && !!result.value) {
                    return result.value
                }
            }).filter(Boolean)

            for (const torrent of torrents) {
                await torrentManager.current.pauseTorrent(torrent.raw.hash)
            }

            const organizedTorrents = torrents.map(torrent => {
                const queueInfo = torrentQueue.find(item => item.torrent.hash === torrent.raw.hash)
                console.log(queueInfo)
                const torrentContent = contents
                    .filter(n => n.hash === torrent.raw.hash) // Get the torrent's files
                    .flatMap(n => n.content)
                    .filter(Boolean)
                    .flatMap(content => ({ // Parse anime data from each file
                        ...content,
                        originalName: path.basename(content.name),
                        parsed: rakun.parse(content.name),
                    }))

                const episodeContent = torrentContent.filter(content => !!content.parsed.episode) // Keep files that have an episode
                const rest = torrentContent.filter(content => !content.parsed.episode) // Keep files that have an episode

                return {
                    torrent,
                    acceptedFiles: episodeContent
                        .filter(content => queueInfo?.downloadInfo.episodeNumbers.includes(Number(content.parsed.episode!)) && !valueContainsNC(content.originalName) && !valueContainsSpecials(content.originalName))
                        .filter(Boolean)
                    ,
                    rejectedFileIndices: [
                        ...episodeContent
                            .filter(content => (
                                !queueInfo?.downloadInfo.episodeNumbers.includes(Number(content.parsed.episode!))
                                || valueContainsNC(content.originalName)
                                || valueContainsSpecials(content.originalName)
                            ))
                            // @ts-ignore
                            .map(content => String(content.index))
                            .filter(Boolean) as string[],
                        //@ts-ignore
                        ...rest.map(content => String(content.index)),
                    ],
                }
            })

            return organizedTorrents
        },
        refetchInterval: 1000,
        enabled: fetchTorrent && torrentsInQueue?.some(n => n.totalSize > 0) && torrentQueue?.filter(item => item?.status === "ready").length > 0,
        keepPreviousData: false,
    })

    useUpdateEffect(() => {
        console.log("torrentsInQueue", torrentsInQueue)
        if (torrentsInQueue) {
            for (const torrent of torrentsInQueue) {
                if (isTorrentReady(torrent)) {
                    updateTorrentStatus(torrent.raw.hash, "ready")
                }
            }
        }
    }, [torrentsInQueue])

    useUpdateEffect(() => {
        (async () => {
            console.log("torrentsWithContent", torrentsWithContent)
            if (torrentsWithContent) {
                if (torrentsWithContent.some(item => item.rejectedFileIndices.length > 0)) {
                    // Do not download rejected files
                    await Promise.allSettled(torrentsWithContent.map(organizedTorrent => (
                        torrentManager.current.setFilePriority(organizedTorrent.torrent.raw.hash, {
                            ids: organizedTorrent.rejectedFileIndices,
                            priority: 0,
                        })
                    )))
                }
                // Remove torrents from queue
                for (const organizedTorrent of torrentsWithContent) {
                    deleteTorrentFromQueue(organizedTorrent.torrent.raw.hash)
                }
                // Un-pause torrents
                // await Promise.allSettled(torrentQueue.filter(n => !!n?.torrent).map(item => (
                //     torrentManager.current.startTorrent(item.torrent.hash)
                // )))
            }
        })()
    }, [torrentsWithContent])
    //
    // useEffect(() => {
    //     console.log(fetchStatus)
    // }, [fetchStatus])
    //
    // useEffect(() => {
    //     console.log(enabled)
    //     console.log(data)
    // }, [data, enabled])

    async function kickstart() {
        if (torrentQueue.length > 0) {
            await Promise.allSettled(torrentQueue.filter(n => !!n?.torrent).map(item => (
                torrentManager.current.startTorrent(item.torrent.hash)
            )))
            toggleFetchTorrent(true)
        }
    }

    return (
        <div>
            {/*{JSON.stringify(torrentQueue, null, 2)}*/}
            <Button onClick={kickstart}>Kickstart</Button>
            <Button onClick={emptyQueue}>Empty</Button>
        </div>
    )

}
