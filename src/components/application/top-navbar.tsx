"use client"
import React, { useMemo } from "react"
import { NavigationTabs, NavigationTabsProps } from "@/components/ui/tabs"
import { usePathname } from "next/navigation"
import { useAuthed } from "@/atoms/auth"
import { IoLibrary } from "@react-icons/all-files/io5/IoLibrary"
import { useAtomValue } from "jotai/react"
import { __episodesUptToDateAtom } from "@/app/(main)/schedule/_containers/missed-episodes/missed-episodes"
import { Badge } from "@/components/ui/badge"

interface TopNavbarProps {
    children?: React.ReactNode
}

export const TopNavbar: React.FC<TopNavbarProps> = (props) => {

    const { children, ...rest } = props

    const pathname = usePathname()
    const { isAuthed } = useAuthed()

    const missedEpisodesIsUpToDate = useAtomValue(__episodesUptToDateAtom)

    const navigationItems = useMemo<NavigationTabsProps["items"]>(() => {
        const authedItems = isAuthed ? [
            {
                href: "/schedule",
                icon: null,
                isCurrent: pathname.startsWith("/schedule"),
                name: "Schedule",
                addon: missedEpisodesIsUpToDate === false ? <Badge
                    intent={"alert-solid"}
                    className={"rounded-full block h-3 w-3 p-0 absolute top-3 right-1"}/> : undefined,
            },
            {
                href: "/anilist",
                icon: null,
                isCurrent: pathname.startsWith("/anilist"),
                name: "Watch lists",
            },
        ] : []

        return [
            {
                href: "/",
                icon: IoLibrary,
                isCurrent: pathname === "/",
                name: "My library",
            },
            ...authedItems,
            {
                href: "/discover",
                icon: null,
                isCurrent: pathname.startsWith("/discover"),
                name: "Discover",
            },
        ]
    }, [isAuthed, pathname, missedEpisodesIsUpToDate])

    return (
        <NavigationTabs
            className="p-0"
            iconClassName=""
            tabClassName="text-xl"
            items={navigationItems}
        />
    )

}
