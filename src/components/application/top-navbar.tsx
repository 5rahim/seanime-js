"use client"
import React, { useMemo } from "react"
import { NavigationTabs, NavigationTabsProps } from "@/components/ui/tabs"
import { usePathname } from "next/navigation"
import { useAuthed } from "@/atoms/auth"
import { IoLibrary } from "@react-icons/all-files/io5/IoLibrary"
import { useAtomValue } from "jotai/react"
import { missingEpisodeCountAtom } from "@/app/(main)/schedule/_containers/missing-episodes/missing-episodes"
import { Badge } from "@/components/ui/badge"

interface TopNavbarProps {
    children?: React.ReactNode
}

export const TopNavbar: React.FC<TopNavbarProps> = (props) => {

    const { children, ...rest } = props

    const pathname = usePathname()
    const { isAuthed } = useAuthed()
    const missingEpisodes = useAtomValue(missingEpisodeCountAtom)


    const navigationItems = useMemo<NavigationTabsProps["items"]>(() => {
        const authedItems = isAuthed ? [
            {
                href: "/schedule",
                icon: null,
                isCurrent: pathname.startsWith("/schedule"),
                name: "Schedule",
                addon: missingEpisodes > 0 ? <Badge className={"absolute top-4 right-2 h-2 w-2 p-0"} size={"sm"}
                                                    intent={"alert-solid"}/> : undefined,
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
    }, [isAuthed, pathname])

    return (
        <NavigationTabs
            className="p-0"
            iconClassName=""
            tabClassName="text-xl"
            items={navigationItems}
        />
    )

}
