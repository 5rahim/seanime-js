import React, { useState } from "react";
import { listen, Event } from "@tauri-apps/api/event";
import { appWindow } from "@tauri-apps/api/window";

export const useWindowSize = () => {

    const [windowSize, setSize] = useState({ width: 0, height: 0 })
    const [isMaximized, setIsMaximized] = useState(false)

    React.useLayoutEffect(() => {
        listen<string>('tauri://resize', (event) => {
            setSize(event.payload as any)
        })
    }, [])

    React.useLayoutEffect(() => {
        (async () => {
            const maximized = await appWindow.isMaximized()
            setIsMaximized(maximized)
        })()
    }, [windowSize])

    return {
        windowSize,
        isMaximized
    }

}
