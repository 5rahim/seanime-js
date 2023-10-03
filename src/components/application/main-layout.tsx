"use client"
import { AppLayout, AppSidebarProvider } from "@/components/ui/app-layout"
import React from "react"
import { useAtomValue } from "jotai/react"
import { LoadingOverlay } from "@/components/ui/loading-spinner"
import Image from "next/image"
import { anilistClientTokenAtom } from "@/atoms/auth"
import { useRefreshAnilistCollectionPeriodically } from "@/atoms/anilist/collection.atoms"
import dynamic from "next/dynamic"
import { MainSidebar } from "@/components/application/main-sidebar"

const GlobalSearch = dynamic(() => import("@/components/application/global-search").then((mod) => mod.GlobalSearch))

export const MainLayout = ({ children }: { children: React.ReactNode }) => {

    const token = useAtomValue(anilistClientTokenAtom)

    useRefreshAnilistCollectionPeriodically()

    if (token === null) return <LoadingOverlay hideSpinner>
        <Image
            src={"/icons/android-chrome-192x192.png"}
            alt={"Loading..."}
            priority
            width={80}
            height={80}
            className={"animate-bounce"}
        />
    </LoadingOverlay>

    return (
        <>
            <AppSidebarProvider>
                <AppLayout withSidebar sidebarSize="slim">
                    <AppLayout.Sidebar>
                        <MainSidebar/>
                    </AppLayout.Sidebar>
                    <AppLayout>
                        <AppLayout.Content>
                            {children}
                        </AppLayout.Content>
                    </AppLayout>
                </AppLayout>
            </AppSidebarProvider>
            <GlobalSearch/>
        </>
    )
}
