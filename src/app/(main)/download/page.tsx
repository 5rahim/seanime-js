"use client"
import { useAsync } from "react-use"
import { useRef } from "react"
import { TorrentManager } from "@/lib/download"
import { useSettings } from "@/atoms/settings"

export default function Page() {

    const { settings } = useSettings()
    const torrentManager = useRef(TorrentManager(settings))


    const state = useAsync(async () => {
        return await torrentManager.current.getAllTorrents()
    })

    return (
        <>
            <iframe
                src={"http://localhost:8081"}
                className={"w-full h-screen"}
            />
        </>
    )
}
