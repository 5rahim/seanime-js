import { AppLayout, AppSidebar, AppSidebarProvider } from '@/components/ui/app-layout'
import { VerticalNav } from '@/components/ui/vertical-nav'
import React from "react";
import { BiHome } from "@react-icons/all-files/bi/BiHome";
import { MainSidebar } from "@/components/application/main-sidebar";

export const MainLayout = (children?: { children: React.ReactNode }) => {
    return (
        <AppSidebarProvider>
            <AppLayout withSidebar sidebarSize="slim">
                <AppLayout.Sidebar>
                    <MainSidebar />
                </AppLayout.Sidebar>
                <AppLayout>
                    <AppLayout.Content>

                    </AppLayout.Content>
                </AppLayout>
            </AppLayout>
        </AppSidebarProvider>
    )
}
