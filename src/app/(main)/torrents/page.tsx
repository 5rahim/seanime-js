"use client"
import { useSettings } from "@/atoms/settings"
import React, { useEffect, useRef } from "react"
import { TorrentManager, TorrentManagerObject } from "@/lib/download"
import { useQuery } from "@tanstack/react-query"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { TorrentManager_Torrent } from "@/lib/download/qbittorrent/api"
import { AppLayoutStack } from "@/components/ui/app-layout"
import Link from "next/link"
import { Button, IconButton } from "@/components/ui/button"
import { BiLinkExternal } from "@react-icons/all-files/bi/BiLinkExternal"
import { addMinutes, formatDistanceToNow } from "date-fns"
import { cn } from "@/components/ui/core"
import { BiPause } from "@react-icons/all-files/bi/BiPause"
import { BiPlay } from "@react-icons/all-files/bi/BiPlay"
import { BiFolder } from "@react-icons/all-files/bi/BiFolder"
import { openDirectoryInExplorer } from "@/lib/helpers/directory"
import { Tooltip } from "@/components/ui/tooltip"
import { BiStop } from "@react-icons/all-files/bi/BiStop"
import { BiUpArrow } from "@react-icons/all-files/bi/BiUpArrow"
import { BiDownArrow } from "@react-icons/all-files/bi/BiDownArrow"
import { BiTime } from "@react-icons/all-files/bi/BiTime"
import { LuffyError } from "@/components/shared/luffy-error"

export default function Page() {

    return (
        <AppLayoutStack className={"p-4"}>
            <div className={"flex items-center w-full justify-between"}>
                <h2>Active torrents</h2>
                <div className={""}>
                    <Link href={`/torrents/embedded`}>
                        <Button intent={"white"} rightIcon={<BiLinkExternal/>}>Embedded client</Button>
                    </Link>
                </div>
            </div>

            <div className={"pb-10"}>
                <Content/>
            </div>
        </AppLayoutStack>
    )
}

type Props = {}

function Content(props: Props) {
    const { settings } = useSettings()

    const torrentManager = useRef(TorrentManager(settings))

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["torrents"],
        queryFn: async () => {
            return await torrentManager.current.getDownloadingTorrents()
        },
        refetchInterval: 2500,
        cacheTime: 0,
        refetchOnWindowFocus: true,
        keepPreviousData: false,
        suspense: false,
        retry: 2,
    })

    useEffect(() => {
        torrentManager.current.kickstart()
        refetch()
    }, [])

    if (isLoading) return <LoadingSpinner/>
    return (
        <AppLayoutStack className={""}>
            {data?.filter(Boolean)?.map(torrent => {
                return <TorrentItem
                    key={torrent.id}
                    torrent={torrent}
                    readableState={torrentManager.current.readableState}
                    torrentManager={torrentManager}
                    refetch={refetch}
                />
            })}
            {(!!data && data?.length === 0) && <LuffyError title={null}>No active torrents</LuffyError>}
        </AppLayoutStack>
    )
}

type TorrentItemProps = {
    torrent: TorrentManager_Torrent
    readableState: (value: any) => string
    torrentManager: React.MutableRefObject<TorrentManagerObject>
    refetch: () => void
}

function TorrentItem({ torrent, readableState, torrentManager, refetch }: TorrentItemProps) {

    const speed = torrent.downloadSpeed > 0 ? `${readablizeBytes(torrent.downloadSpeed)}/s` : `0 kB/s`
    const upSpeed = torrent.downloadSpeed > 0 ? `${readablizeBytes(torrent.uploadSpeed)}/s (up)` : `0 kB/s (up)`
    const eta = torrent.eta === 8640000 ? `No ETA` : `${formatDistanceToNow(addMinutes(new Date(), Math.ceil(torrent.eta / 60)), { addSuffix: false })} left`
    const progress = `${(torrent.progress * 100).toFixed(1)}%`
    const state = readableState(torrent.state)


    return (
        <div className={"p-4 border rounded-md border-[--border] overflow-hidden relative flex gap-2"}>
            <div className={"absolute top-0 w-full h-1 z-[1] bg-gray-700 left-0"}>
                <div className={cn(
                    "h-1 absolute z-[2] left-0 bg-gray-200 transition-all",
                    {
                        "bg-green-300": state === "Downloading",
                        "bg-gray-500": state === "Paused",
                        "bg-blue-500": state === "Seeding",
                    },
                )}
                     style={{ width: `${String(Math.floor(torrent.progress * 100))}%` }}></div>
            </div>
            <div className={"w-full"}>
                <div
                    className={cn({
                        "opacity-50": state === "Paused",
                    })}
                >{torrent.name}</div>
                <div className={"text-[--muted]"}>
                    <span className={cn({ "text-green-300": state === "Downloading" })}>{progress}</span>
                    {` `}
                    <BiDownArrow className={"inline-block mx-2 mb-1"}/>
                    {speed}
                    {` `}
                    <BiUpArrow className={"inline-block mx-2"}/>
                    {upSpeed}
                    {` `}
                    <BiTime className={"inline-block mx-2 mb-0.5"}/>
                    {eta}
                    {` - `}
                    <span>{torrent.seeds} {torrent.seeds !== 1 ? "seeds" : "seed"}</span>
                    {` - `}
                    <span>{torrent.peers} {torrent.peers !== 1 ? "peers" : "peer"}</span>
                    {` - `}
                    <strong
                        className={cn({
                            "text-blue-300": state === "Seeding",
                        })}
                    >{state}</strong>
                </div>
            </div>
            <div className={"flex gap-2 items-center"}>
                <div className={"flex-none"}>
                    <IconButton
                        icon={<BiFolder/>}
                        size={"sm"}
                        intent={"gray-subtle"}
                        className={"flex-none"}
                        onClick={async () => {
                            openDirectoryInExplorer(torrent.savePath)
                        }}
                    />
                </div>
                {state !== "Seeding" ? (
                    <>
                        <Tooltip trigger={<IconButton
                            icon={<BiPause/>}
                            size={"sm"}
                            intent={"gray-subtle"}
                            className={"flex-none"}
                            onClick={async () => {
                                await torrentManager.current.pauseTorrent(torrent.hash)
                                refetch()
                            }}
                        />}>Pause</Tooltip>
                        <Tooltip trigger={<div>{state !== "Downloading" && <IconButton
                            icon={<BiPlay/>}
                            size={"sm"}
                            intent={"gray-subtle"}
                            className={"flex-none"}
                            onClick={async () => {
                                await torrentManager.current.startTorrent(torrent.hash)
                                refetch()
                            }}
                        />}</div>}>
                            Resume
                        </Tooltip>
                    </>
                ) : <Tooltip trigger={<IconButton
                    icon={<BiStop/>}
                    size={"sm"}
                    intent={"primary"}
                    className={"flex-none"}
                    onClick={async () => {
                        await torrentManager.current.pauseTorrent(torrent.hash)
                        refetch()
                    }}
                />}>End</Tooltip>}
            </div>
        </div>
    )
}

function readablizeBytes(bytes: number) {
    if (bytes === 0) return "0 kB"
    let s = ["B", "kB", "MB", "GB", "TB", "PB"]
    let e = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, e)).toFixed(1) + " " + s[e]
}
