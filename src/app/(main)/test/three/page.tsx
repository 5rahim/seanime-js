"use client"

import React from "react"
import { useSettings } from "@/atoms/settings"
import { useMount } from "react-use"
import rakun from "@/lib/rakun/rakun"

export default function Page() {

    const { settings } = useSettings()

    useMount(() => {

        console.log(rakun.parse("[Erai-raws] Spy x Family Cour 02 - 04 [1080p][Multiple Subtitle][46F7D7A1].mkv"))
    })

    return (
        <div>
            {/*{JSON.stringify(torrentQueue, null, 2)}*/}
        </div>
    )

}
