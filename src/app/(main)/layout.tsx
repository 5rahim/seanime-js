"use client"
import React, { useMemo } from "react"
import { usePathname } from "next/navigation"
import { useAuthed } from "@/atoms/auth"
import { useCurrentUser } from "@/atoms/user"
import { NavigationTabs } from "@/components/ui/tabs"
import Image from "next/image"
import { IoReload } from "@react-icons/all-files/io5/IoReload"
import { Button } from "@/components/ui/button"
import { useStoredAnilistCollection } from "@/atoms/anilist-collection"

export default function Layout({ children }: {
    children: React.ReactNode,
}) {

    const pathname = usePathname()
    const { isAuthed } = useAuthed()
    const { user } = useCurrentUser()
    const { refetchCollection } = useStoredAnilistCollection()

    const navigationItems = useMemo(() => {
        const authedItems = isAuthed ? [
            {
                href: "/anilist",
                icon: null,
                isCurrent: pathname.includes("/anilist"),
                name: "Watch lists",
            },
        ] : []

        return [
            {
                href: "/",
                icon: null,
                isCurrent: pathname === "/",
                name: "My library",
            },
            ...authedItems,
        ]
    }, [isAuthed, pathname])

    return (
        <main className="min-h-screen">
            <div className={"w-full h-[8rem] relative overflow-hidden pt-[--titlebar-h]"}>
                <div className="relative z-10 px-4 w-full flex justify-between items-center">
                    <NavigationTabs
                        className="p-0"
                        iconClassName=""
                        tabClassName="text-xl"
                        items={navigationItems}
                    />
                    <div className={"flex items-center gap-4"}>
                        <Button
                            onClick={refetchCollection}
                            intent={"warning-subtle"}
                            rightIcon={<IoReload/>}
                            leftIcon={<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="24" height="24"
                                           viewBox="0 0 24 24" role="img">
                                <path
                                    d="M6.361 2.943 0 21.056h4.942l1.077-3.133H11.4l1.052 3.133H22.9c.71 0 1.1-.392 1.1-1.101V17.53c0-.71-.39-1.101-1.1-1.101h-6.483V4.045c0-.71-.392-1.102-1.101-1.102h-2.422c-.71 0-1.101.392-1.101 1.102v1.064l-.758-2.166zm2.324 5.948 1.688 5.018H7.144z"/>
                            </svg>}
                            className={"hover:bg-transparent dark:hover:bg-transparent"}
                        >
                            Actualize AniList
                        </Button>
                        {isAuthed && (
                            <p>{user?.name}</p>
                        )}
                    </div>
                </div>
                {!pathname.includes("/view") && <>
                    {!pathname.includes("/anilist") && <Image
                        src={"/landscape-beach.jpg"}
                        alt={"tenki no ko"}
                        fill
                        priority
                        className={"object-cover object-top"}
                    />}
                    {pathname.includes("/anilist") && <Image
                        src={"/landscape-tenki-no-ko.jpg"}
                        alt={"tenki no ko"}
                        fill
                        priority
                        className={"object-cover"}
                    />}
                    <div
                        className={"w-full absolute bottom-0 h-[20rem] bg-gradient-to-t from-[--background-color] to-transparent"}/>
                </>}
            </div>

            <div>
                {children}
            </div>

        </main>
    )

}
