"use client"
import { AppLayout, AppSidebarProvider } from "@/components/ui/app-layout"
import React from "react"
import { MainSidebar } from "@/components/application/main-sidebar"
import { useAtomValue } from "jotai/react"
import { LoadingOverlay } from "@/components/ui/loading-spinner"
import { GlobalSearch } from "@/components/application/global-search"
import Image from "next/image"
import { anilistClientTokenAtom } from "@/atoms/auth"
import { useRefreshAnilistCollectionPeriodically } from "@/atoms/anilist/collection.atoms"

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
