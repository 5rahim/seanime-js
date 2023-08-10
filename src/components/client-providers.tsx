"use client"
import React from "react"
import { UIProvider } from "@/components/ui/core"
import { createStore } from "jotai"
import { ThemeProvider } from "next-themes"
import { Provider as JotaiProvider } from "jotai/react"

interface ClientProvidersProps {
    children?: React.ReactNode
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({ children, ...rest }) => {

    const [store] = React.useState(createStore())

    return (
        <ThemeProvider attribute={"class"} defaultTheme={"dark"}>
            <JotaiProvider store={store}>
                <UIProvider config={{ locale: "en", countryLocale: "en-US", country: "US" }}>
                    {children}
                </UIProvider>
            </JotaiProvider>
        </ThemeProvider>
    )

}
