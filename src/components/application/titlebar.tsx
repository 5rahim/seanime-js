"use client"

import React from "react"
import { appWindow } from "@tauri-apps/api/window"
import { cva } from "class-variance-authority"
import { cn } from "@/components/ui/core"
import { useWindowSize } from "@/hooks/use-window-size"
import toast from "react-hot-toast"
import { useIsomorphicLayoutEffect } from "react-use"

/* -------------------------------------------------------------------------------------------------
 * TitleBar
 * -----------------------------------------------------------------------------------------------*/

const titleBarButtonStyles = cva([
    "inline-flex justify-center bg-[--background-color] items-center w-12 h-8 text-sm transition duration-100",
    "hover:bg-gray-700"
])

export interface TitleBarProps extends React.ComponentPropsWithRef<"div"> {
    children?: React.ReactNode
}

export const TitleBar: React.FC<TitleBarProps> = React.forwardRef<HTMLDivElement, TitleBarProps>((props, ref) => {

    const {
        children,
        className,
        ...rest
    } = props

    const { windowSize, isMaximized } = useWindowSize()

    useIsomorphicLayoutEffect(() => {
        document?.getElementById("titlebar-minimize")?.addEventListener("click", () => appWindow.minimize())
        document?.getElementById("titlebar-maximize")?.addEventListener("click", () => appWindow.toggleMaximize())
        document?.getElementById("titlebar-close")?.addEventListener("click", () => appWindow.close())
    }, [])

    useIsomorphicLayoutEffect(() => {
        (async () => {
            const unlistenProgress = await appWindow.listen(
                "video-player-error",
                ({ event, payload }) => {
                    toast.error("Video player error")
                },
            )

            return unlistenProgress()
        })()
    }, [])

    // const hydrated = useDisclosure(false)
    //
    // React.useLayoutEffect(() => {
    //     hydrated.open()
    // }, [])
    //
    // if(!hydrated.isOpen) return null

    return (
        <div data-tauri-drag-region
             className="h-[--titlebar-h] bg-transparent select-none flex justify-between fixed top-0 left-0 right-0 z-[999]">
            <div className={"h-[--titlebar-h] inline-flex items-center px-4 font-bold"}>
                {/*<p>Seanime</p>*/}
            </div>
            <div>
                <div className={cn(titleBarButtonStyles())} id="titlebar-minimize">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                    >
                        <path d="M5 11h14v2H5z"></path>
                    </svg>
                </div>
                <div className={cn(titleBarButtonStyles())} id="titlebar-maximize">
                    {!isMaximized && <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        fill="none"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="w-5 h-5"
                    >
                        <rect width="14" height="14" x="5" y="5" rx="2"/>
                    </svg>}
                    {isMaximized &&
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                             className="w-5 h-5">
                            <path d="M8 3v3a2 2 0 0 1-2 2H3"/>
                            <path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                            <path d="M3 16h3a2 2 0 0 1 2 2v3"/>
                            <path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                        </svg>}
                </div>
                <div className={cn(titleBarButtonStyles(), "hover:bg-red-500")} id="titlebar-close">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            d="m16.192 6.344-4.243 4.242-4.242-4.242-1.414 1.414L10.535 12l-4.242 4.242 1.414 1.414 4.242-4.242 4.243 4.242 1.414-1.414L13.364 12l4.242-4.242z"></path>
                    </svg>
                </div>
            </div>
        </div>
    )

})

TitleBar.displayName = "TitleBar"

export default TitleBar
