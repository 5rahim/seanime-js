import React from "react"
import { AppLayout } from "@/components/ui/app-layout"
import { Card } from "@/components/ui/card"
import { SettingsSidebar } from "@/app/settings/_components/settings-sidebar"

export default async function Layout({ children }: {
    children: React.ReactNode,
}) {

    return (
        <main className={"pt-[--titlebar-h] px-4"}>
            <AppLayout.Stack>
                <div>
                    <h4>Settings</h4>
                    <p className="text-sm text-[--muted]">Manage options.</p>
                </div>
                <AppLayout.Grid cols={5}>
                    <div className="col-span-1">
                        <SettingsSidebar/>
                    </div>
                    <div className="col-span-4">
                        <Card>
                            {children}
                        </Card>
                    </div>
                </AppLayout.Grid>
            </AppLayout.Stack>
        </main>
    )
}
