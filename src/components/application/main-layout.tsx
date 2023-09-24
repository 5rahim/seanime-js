"use client"
import { AppLayout, AppSidebarProvider } from "@/components/ui/app-layout"
import React from "react"
import { MainSidebar } from "@/components/application/main-sidebar"
import { useAtomValue } from "jotai/react"
import { userAtom } from "@/atoms/user"
import { LoadingOverlay } from "@/components/ui/loading-spinner"
import { GlobalSearch } from "@/components/application/global-search"
import Image from "next/image"

export const MainLayout = ({ children }: { children: React.ReactNode }) => {

    const user = useAtomValue(userAtom)

    if (user === undefined) return <LoadingOverlay hideSpinner>
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
