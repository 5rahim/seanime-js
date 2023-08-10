import { AppLayout, AppSidebar, AppSidebarProvider } from '@/components/ui/app-layout'
import { VerticalNav } from '@/components/ui/vertical-nav'
import React from "react";

export const MainLayout = (children?: { children: React.ReactNode }) => {
    return (
        <AppSidebarProvider>
            <AppLayout withSidebar sidebarSize="md">
                <AppLayout.Sidebar>
                    <AppSidebar className="p-4">
                        <VerticalNav items={[]}/>
                    </AppSidebar>
                </AppLayout.Sidebar>
                <AppLayout>
                    <AppLayout.Content>

                    </AppLayout.Content>
                </AppLayout>
            </AppLayout>
        </AppSidebarProvider>
    )
}
