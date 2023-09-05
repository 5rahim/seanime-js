"use client"
import React from "react"
import { Drawer } from "@/components/ui/modal"
import { usePathname, useRouter } from "next/navigation"

interface DownloadModalProps {
    children?: React.ReactNode
}

export const DownloadModal: React.FC<DownloadModalProps> = (props) => {

    const { children, ...rest } = props

    const router = useRouter()
    const pathname = usePathname()

    return (
        <Drawer size={"xl"} title={"Torrents"} isOpen={true} onClose={() => router.back()} isClosable>
            {children}
        </Drawer>
    )

}
