"use client"
import React, { useMemo } from "react"
import { usePathname } from "next/navigation"
import { useAuthed } from "@/atoms/auth"
import { useCurrentUser } from "@/atoms/user"
import { NavigationTabs } from "@/components/ui/tabs"
import { AppLayout } from "@/components/ui/app-layout"

export default function Layout({ children }: {
    children: React.ReactNode,
}) {

    const pathname = usePathname()
    const { isAuthed } = useAuthed()
    const { user } = useCurrentUser()

    if (!user) return <div></div>

    const navigationItems = useMemo(() => {
        return [
            {
                href: "/anilist",
                icon: null,
                isCurrent: pathname === "/anilist",
                name: "Currently watching",
            },
            {
                href: "/anilist/completed",
                icon: null,
                isCurrent: pathname === "/anilist/completed",
                name: "Completed",
            },
        ]
    }, [isAuthed, pathname])

    return (
        <AppLayout.Stack>
            <NavigationTabs
                className="p-0"
                iconClassName=""
                tabClassName="text-lg rounded-none border-b border-b-2 border-b-transparent data-[selected=true]:border-brand-400"
                items={navigationItems}
            />
            {children}
        </AppLayout.Stack>
    )

}
