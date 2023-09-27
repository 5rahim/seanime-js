import "../styles/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClientProviders } from "@/components/client-providers"
import { MainLayout } from "@/components/application/main-layout"
import { AtomPreloader } from "@/atoms/storage"
import { Suspense } from "react"
import { LoadingOverlay } from "@/components/ui/loading-spinner"
import { cookies } from "next/headers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "Seanime",
    description: "Manage your anime library.",
    icons: {
        icon: "/icons/favicon.ico",
    },
}

export default async function RootLayout(
    {
        children,
    }: {
        children: React.ReactNode
    },
) {

    return (
        <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
        <script src="http://127.0.0.1:8097"></script>
        <ClientProviders>
            <Suspense fallback={<LoadingOverlay/>}>
                <AtomPreloader anilistToken={cookies().get("anilistToken")?.value}/>
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
