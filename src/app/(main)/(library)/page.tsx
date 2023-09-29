"use client"

import React from "react"
import { useSettings } from "@/atoms/settings"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { LocalLibrary } from "@/app/(main)/(library)/_containers/local-library/local-library"
import { LibraryToolbar } from "@/app/(main)/(library)/_containers/local-library/_components/library-toolbar"
import { IgnoredFilesDrawer } from "@/app/(main)/(library)/_containers/ignored-files/ignored-files-drawer"
import { useAuthed } from "@/atoms/auth"
import { ANILIST_OAUTH_URL } from "@/lib/anilist/config"
import { BiCog } from "@react-icons/all-files/bi/BiCog"
import { FirstScanScreen } from "@/app/(main)/(library)/_containers/local-library/first-scan-screen"

export default function Home() {

    const { isAuthed } = useAuthed()
    const { settings } = useSettings()

    if (!isAuthed) return (
        <AppLayoutStack>
            <div className={"pt-10 text-center space-y-4"}>
                <h1>Welcome!</h1>
                <Button
                    onClick={() => {
                        window.open(ANILIST_OAUTH_URL, "_self")
                    }}
                    intent={"primary-outline"}
                    size={"xl"}
                >Log in with AniList</Button>
            </div>
        </AppLayoutStack>
    )

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
                <div>
                    <p>First, you need to select your <strong>local library</strong> directory in the settings.</p>
                    <p>Then, make sure to update other settings to ensure a perfect experience.</p>
                </div>
                <div>
                    <Link href={"/settings"}>
                        <Button intent={"warning-subtle"} leftIcon={<BiCog/>}>Go to the settings</Button>
                    </Link>
                </div>
            </div>
        </AppLayoutStack>
    )

    return (
        <div>
            <LibraryToolbar/>
            <LocalLibrary/>
            <FirstScanScreen/>
            <IgnoredFilesDrawer/>
        </div>
    )
}
