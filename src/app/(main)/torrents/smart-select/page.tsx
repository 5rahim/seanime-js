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
import { LoadingOverlay } from "@/components/ui/loading-spinner"
import { useRouter } from "next/navigation"
import { path_getBasename } from "@/lib/helpers/path"
import { valueContainsNC, valueContainsSpecials } from "@/lib/local-library/utils/filtering.utils"
import { anilist_getEpisodeCeilingFromMedia } from "@/lib/anilist/utils"

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
                // Stop downloading of all files
                await torrentManager.current.pauseTorrent(torrent.raw.hash)
            }

            // Organize the torrents files
            return torrents.map(torrent => {
                // Get queue item
                const queueItem = torrentQueue.find(item => item.torrent.hash === torrent.raw.hash)
                const episodeOffset = queueItem?.episodeOffset || 0
                const media = queueItem?.media!

                const torrentContent = contents // -> { file, originalName, parsed }
                    .filter(n => n.hash === torrent.raw.hash) // Get the torrent's files
                    .flatMap(n => n.content)
                    .filter(Boolean)
                    .flatMap(file => {
                        const parsed = rakun.parse(path_getBasename(file.name))
                        return { // Parse anime data from each file
                            file: file,
                            originalName: path_getBasename(file.name),
                            parsed,
                        }
                    })

                // Files that have an episode
                const filesWithEpisodes = torrentContent.filter(content => !!content.parsed.episode && !isNaN(Number(content.parsed.episode)))
                // .filter(/* TODO Filter out episode under folder with another season */)

                // Apply episode offset when:
                const shouldApplyEpisodeOffset =
                    // Absolute episode detected
                    filesWithEpisodes.some(content => (Number(content.parsed.episode) > anilist_getEpisodeCeilingFromMedia(media)))
                    // Not every episode number with offset is negative
                    && filesWithEpisodes.some(content => (Number(content.parsed.episode) - episodeOffset) > 0)

                const contentEpisodes = filesWithEpisodes.map(content => {
                    return {
                        ...content,
                        trueEpisode: shouldApplyEpisodeOffset ? Number(content.parsed.episode) - episodeOffset : Number(content.parsed.episode), // Relative episode
                    }
                })
                const rest = torrentContent.filter(content => !content.parsed.episode) // Files that don't have an episode

                const acceptedFileIndices = contentEpisodes
                    // Keep files that are not specials or NC and include an episode number
                    .filter(content => (
                        !!content.trueEpisode &&
                        queueItem?.downloadInfo.episodeNumbers.includes(Number(content.trueEpisode))
                        && !valueContainsNC(content.originalName)
                        && !valueContainsSpecials(content.originalName)
                    ))
                    .filter(Boolean)
                    .map(content => String(content.file.index))
                    .filter(Boolean)

                const rejectedFileIndices = [
                    ...contentEpisodes.filter(content => !acceptedFileIndices.includes(String(content.file.index))).map(content => String(content.file.index)),
                    ...rest.map(content => String(content.file.index)),
                ]

                return {
                    torrent,
                    acceptedFileIndices,
                    rejectedFileIndices,
                }
            })
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
                    // Deselect rejected files
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
