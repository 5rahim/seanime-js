"use client"
import React from "react"
import { useAuthed } from "@/atoms/auth"
import { IoReload } from "@react-icons/all-files/io5/IoReload"
import { Button } from "@/components/ui/button"

import { useRefreshAnilistCollection } from "@/atoms/anilist/collection.atoms"
import { TopNavbar } from "@/components/application/top-navbar"
import { DynamicHeaderBackground } from "@/components/application/dynamic-header-background"

export default function Layout({ children }: {
    children: React.ReactNode,
}) {

    const { isAuthed } = useAuthed()
    const refetchCollection = useRefreshAnilistCollection()

    return (
        <main className="min-h-screen">
            <div className={"w-full h-[8rem] relative overflow-hidden pt-[--titlebar-h]"}>
                <div className="relative z-10 px-4 w-full flex justify-between items-center">
                    <TopNavbar/>
                    <div className={"flex items-center gap-4"}>
                        {isAuthed && <Button
                            onClick={() => refetchCollection()}
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
                        </Button>}
                        {/*{isAuthed && (*/}
                        {/*    <p>{user?.name}</p>*/}
                        {/*)}*/}
                    </div>
                </div>
                <DynamicHeaderBackground/>
            </div>

            <div>
                {children}
            </div>

        </main>
    )

}
