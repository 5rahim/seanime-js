"use client"
import { useSettings } from "@/atoms/settings"

export default function Page() {

    const { settings } = useSettings()

    return (
        <>
            <div
                className={"w-[80%] h-[calc(100vh-15rem)] rounded-xl border border-[--border] overflow-hidden mx-auto mt-10 ring-1 ring-[--border] ring-offset-2"}>
                <iframe
                    src={"http://localhost:8081"}
                    className={"w-full h-full"}
                />
            </div>
        </>
    )
}
