"use client"
import React from "react"
import { useCurrentUser } from "@/atoms/user"
import { AppLayout } from "@/components/ui/app-layout"

export default function Layout({ children }: {
    children: React.ReactNode,
}) {

    const { user } = useCurrentUser()

    if (!user) return <div></div>


    return (
        <AppLayout.Stack>
            {children}
        </AppLayout.Stack>
    )

}
