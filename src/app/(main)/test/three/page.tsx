"use client"

import React from "react"
import { useSettings } from "@/atoms/settings"
import { useMount } from "react-use"

export default function Page() {

    const { settings } = useSettings()

    useMount(() => {

        // console.log(rakun.parse("[Judas] Blue Lock - S01E01v2.mkv"))
        console.log()
    })

    return (
        <div>
            {/*{JSON.stringify(torrentQueue, null, 2)}*/}
        </div>
    )

}
