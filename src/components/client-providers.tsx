import React from "react"
import { UIProvider } from "@/components/ui/core"

interface ClientProvidersProps {
    children?: React.ReactNode
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({ children, ...rest }) => {

    return (
        <UIProvider config={{ locale: "en", countryLocale: "en-US", country: "US" }}>
            {children}
        </UIProvider>
    )

}
