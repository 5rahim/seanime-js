"use client"
import { useSettings } from "@/atoms/settings"
import { useEffect, useRef } from "react"
import { TorrentRepository } from "@/lib/download"

export default function Page() {

    const { settings } = useSettings()
    const torrentManager = useRef(TorrentRepository(settings))

    useEffect(() => {
        torrentManager.current.kickstart()
    }, [])

    return (
        <>
            <div
                className={"w-[80%] h-[calc(100vh-15rem)] rounded-xl border border-[--border] overflow-hidden mx-auto mt-10 ring-1 ring-[--border] ring-offset-2"}>
                <iframe
                    src={`http://${settings.qbittorrent.host}:${String(settings.qbittorrent.port)}`}
                    className={"w-full h-full"}
                />
            </div>
        </>
    )
}
