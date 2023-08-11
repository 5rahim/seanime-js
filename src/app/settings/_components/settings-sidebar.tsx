"use client"
import { BiListCheck } from "@react-icons/all-files/bi/BiListCheck"
import { VerticalNav } from "@/components/ui/vertical-nav"
import React from "react"
import { usePathname } from "next/navigation"

export function SettingsSidebar() {

    const pathname = usePathname()

    return (
        <VerticalNav
            items={[
                {
                    href: "/settings",
                    icon: BiListCheck,
                    isCurrent: pathname === "/settings",
                    name: "My library",
                },
            ]}
        />
    )

}
