import "../styles/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClientProviders } from "@/components/client-providers"
import { MainLayout } from "@/components/application/main-layout"
import { AtomPreloader } from "@/atoms/storage"
import dynamic from "next/dynamic"
import { Suspense } from "react"
import { LoadingOverlay } from "@/components/ui/loading-spinner"

const TitleBar = dynamic(() => import("@/components/application/titlebar"), { ssr: false })

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "Seanime",
    description: "Manage your anime library.",
}

export default async function RootLayout(
    {
        children,
    }: {
        children: React.ReactNode
    },
) {

    return (
        <html lang="en">
        <body className={inter.className}>
        <TitleBar/>
        <ClientProviders>
            <Suspense fallback={<LoadingOverlay/>}>
                <AtomPreloader/>
                <MainLayout>
                    {children}
                </MainLayout>
            </Suspense>
        </ClientProviders>
        </body>
        </html>
    )
}

export const runtime = "nodejs"
