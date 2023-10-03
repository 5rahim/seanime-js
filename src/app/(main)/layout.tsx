import React from "react"
import { TopNavbar } from "@/components/application/top-navbar"
import { RefreshAnilistButton } from "@/components/application/refresh-anilist-button"
import { AppSidebarTrigger } from "@/components/ui/app-layout/app-sidebar"
import { DynamicHeaderBackground } from "@/components/application/dynamic-header-background"

export default async function Layout({ children }: {
    children: React.ReactNode,
}) {

    return (
        <main className="min-h-screen">
            <div className={"w-full md:h-[8rem] relative overflow-hidden pt-[--titlebar-h]"}>
                <div className="relative z-10 px-4 w-full flex flex-col md:flex-row justify-between md:items-center">
                    <div className={"flex items-center w-full gap-2"}>
                        <AppSidebarTrigger/>
                        <TopNavbar/>
                    </div>
                    <div className={"flex items-center gap-4"}>
                        <RefreshAnilistButton/>
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
