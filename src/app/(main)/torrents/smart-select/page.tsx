"use client"

import React, { useRef } from "react"
import { useMount, useToggle, useUpdateEffect } from "react-use"
import { useSettings } from "@/atoms/settings"
import { TorrentManager } from "@/lib/download"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai/react"
import {
    torrentSmartSelectQueueAtom,
    useTorrentSmartSelectQueue,
} from "@/atoms/torrent/torrent-smart-select-queue.atoms"
import { isTorrentReady } from "@/lib/download/torrent-helpers"
import rakun from "@/lib/rakun"
import { valueContainsNC, valueContainsSpecials } from "@/lib/local-library/utils"
import { LoadingOverlay } from "@/components/ui/loading-spinner"
import { useRouter } from "next/navigation"
import { smartSelect_normalizeEpisodes } from "@/app/(main)/torrents/smart-select/_lib/utils"
import { path_getBasename } from "@/lib/helpers/path"

export default function Page() {

    const { settings } = useSettings()
    const router = useRouter()

    const [fetchTorrent, toggleFetchTorrent] = useToggle(false)

    const [torrentQueue, setTorrentQueue] = useAtom(torrentSmartSelectQueueAtom)
    const { emptyQueue, updateTorrentStatus, deleteTorrentFromQueue } = useTorrentSmartSelectQueue()

    const torrentManager = useRef(TorrentManager(settings))

    // "9db6955fc09c1a79d6fbfa822894cc528b0c1e25"

    // 1. Torrent is paused and in queue
    // 2. Unpause torrent until it is ready
    // 3. Pause torrent, unselect un-used files
    // 4. Resume download

    // Query torrents to fetch their status
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

    // Query torrents present in the queue whose status is "ready"
    const { data: torrentsWithContent } = useQuery({
        queryKey: ["test", torrentQueue, torrentsInQueue],
        queryFn: async () => {
            // Fetch torrents that are ready
            const results = await Promise.allSettled(torrentQueue.filter(item => item.status === "ready").map(item => (
                torrentManager.current.getTorrent(item.torrent.hash)
            )))
            // Fetch ready torrents' content
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

            // Pause these torrents
            for (const torrent of torrents) {
                await torrentManager.current.pauseTorrent(torrent.raw.hash)
                // Stop downloading of all files
                // NOT GOOD -> CAUSES TORRENT TO BE CONSIDERED COMPLETELY DOWNLOADED
                // await torrentManager.current.setFilePriority(torrent.raw.hash, {
                //     // @ts-ignore
                //     ids: contents.filter(item => item.hash === torrent.raw.hash).flatMap(item => item.content).map(content => String(content.index)),
                //     priority: 0,
                // })
            }

            // Organize the torrents files
            const organizedTorrents = torrents.map(torrent => {
                const queueInfo = torrentQueue.find(item => item.torrent.hash === torrent.raw.hash)

                const torrentContent = contents // -> { ...torrentFile, originalName, parsed }
                    .filter(n => n.hash === torrent.raw.hash) // Get the torrent's files
                    .flatMap(n => n.content)
                    .filter(Boolean)
                    .flatMap(content => ({ // Parse anime data from each file
                        info: content,
                        originalName: path_getBasename(content.name),
                        parsed: rakun.parse(path_getBasename(content.name)),
                    }))

                // Keep files that have an episode
                // Normalize episode numbers if needed, and return `trueEpisode`
                const episodeContent = smartSelect_normalizeEpisodes(torrentContent.filter(content => !!content.parsed.episode))
                const rest = torrentContent.filter(content => !content.parsed.episode) // Files that don't have an episode

                return {
                    torrent,
                    acceptedFileIndices: episodeContent
                        .filter(content => queueInfo?.downloadInfo.episodeNumbers.includes(Number(content.parsed.episode!)) && !valueContainsNC(content.originalName) && !valueContainsSpecials(content.originalName))
                        .filter(Boolean)
                        //@ts-ignore
                        .map(content => String(content.info.index))
                        .filter(Boolean) as string[]
                    ,
                    rejectedFileIndices: [
                        // Episode files that are not NC/Specials
                        ...episodeContent
                            .filter(content => (
                                !queueInfo?.downloadInfo.episodeNumbers.includes(Number(content.trueEpisode!))
                                || valueContainsNC(content.originalName)
                                || valueContainsSpecials(content.originalName)
                            ))
                            // @ts-ignore
                            .map(content => String(content.info.index))
                            .filter(Boolean) as string[],
                        // Also ignore the rest
                        //@ts-ignore
                        ...rest.map(content => String(content.info.index)),
                    ],
                }
            })

            return organizedTorrents
        },
        refetchInterval: 1000,
        enabled: fetchTorrent && torrentsInQueue?.some(n => n.totalSize > 0) && torrentQueue?.filter(item => item?.status === "ready").length > 0,
        keepPreviousData: false,
    })

    // Look through fetched torrent info
    // If they are ready (file size present), set their status to "ready"
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
                    // Rest file priority of select files
                    await Promise.allSettled(torrentsWithContent.map(organizedTorrent => (
                        torrentManager.current.setFilePriority(organizedTorrent.torrent.raw.hash, {
                            ids: organizedTorrent.rejectedFileIndices,
                            priority: 0,
                        })
                    )))
                }
                // Un-pause torrents
                await Promise.allSettled(torrentQueue.filter(n => !!n?.torrent).map(item => (
                    torrentManager.current.startTorrent(item.torrent.hash)
                )))
                // Remove torrents from queue
                for (const organizedTorrent of torrentsWithContent) {
                    deleteTorrentFromQueue(organizedTorrent.torrent.raw.hash)
                }
            }
        })()
    }, [torrentsWithContent])

    useUpdateEffect(() => {
        if (torrentQueue.length === 0) {
            router.push("/torrents")
        }
    }, [torrentQueue])

    async function kickstart() {
        if (torrentQueue.length > 0) {
            await Promise.allSettled(torrentQueue.filter(n => !!n?.torrent).map(item => (
                torrentManager.current.startTorrent(item.torrent.hash)
            )))
            toggleFetchTorrent(true)
        }
    }

    useMount(() => {
        kickstart()
    })

    return (
        <div>
            <LoadingOverlay className={"fixed w-full h-full z-[80]"}>
                <h3 className={"mt-2"}>Selecting appropriate files...</h3>
            </LoadingOverlay>
            {/*{JSON.stringify(torrentQueue, null, 2)}*/}
            {/*<Button onClick={kickstart}>Kickstart</Button>*/}
            {/*<Button onClick={emptyQueue}>Empty</Button>*/}
        </div>
    )

}
