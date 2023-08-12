"use client"
import React, { useEffect } from "react"
import { UIProvider } from "@/components/ui/core"
import { createStore } from "jotai"
import { ThemeProvider } from "next-themes"
import { Provider as JotaiProvider } from "jotai/react"
import { QueryClient } from "@tanstack/query-core"
import { QueryClientProvider } from "@tanstack/react-query"
import { AniListGraphQLClientProvider } from "@/lib/anilist/graphql-client"
import { ToastProvider } from "@/components/ui/toast"

interface ClientProvidersProps {
    children?: React.ReactNode
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({ children, ...rest }) => {

    const [store] = React.useState(createStore())

    const [queryClient] = React.useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
            },
        },
    }))

    // When the app launches
    useEffect(() => {
        // startMpc()
    }, [])

    return (
        <ThemeProvider attribute={"class"} defaultTheme={"dark"}>
            <JotaiProvider store={store}>
                <AniListGraphQLClientProvider>
                    <QueryClientProvider client={queryClient}>
                        <UIProvider config={{ locale: "en", countryLocale: "en-US", country: "US" }}>
                            {children}
                            <ToastProvider/>
                        </UIProvider>
                    </QueryClientProvider>
                </AniListGraphQLClientProvider>
            </JotaiProvider>
        </ThemeProvider>
    )

}
