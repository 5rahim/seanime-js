"use client"

import React from "react"
import { useSettings } from "@/atoms/settings"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { startMpc, testMPC } from "@/lib/mpc-hc/controls"

export default function Home() {

    const { settings } = useSettings()

    if (!settings.library.localDirectory) return (
        <AppLayoutStack className={"mt-10"}>
            {<div
                className="h-[15rem] w-[15rem] mx-auto flex-none rounded-md object-cover object-center relative overflow-hidden">
                <Image
                    src={"/luffy-01.png"}
                    alt={""}
                    fill
                    quality={100}
                    priority
                    sizes="10rem"
                    className="object-contain object-top"
                />
            </div>}
            <div className={"text-center space-y-4"}>
                <h2>Local library</h2>
                <p>First, you need to select your local library directory in the settings.</p>
                <div>
                    <Link href={"/settings"}>
                        <Button intent={"warning-subtle"}>Choose the directory</Button>
                    </Link>
                </div>
            </div>
        </AppLayoutStack>
    )

    return (
        <main>
            Hello
            <Button onClick={async () => startMpc()}>Start MPC-HC</Button>
            <Button onClick={async () => await testMPC()}>MPC-HC</Button>
        </main>
    )
}
