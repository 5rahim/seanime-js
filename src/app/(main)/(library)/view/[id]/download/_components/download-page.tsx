"use client"
import { Button } from "@/components/ui/button"
import { __testNyaa } from "@/lib/download/nyaa/__test__"

export const DownloadPage = () => {
    return (
        <>
            <Button onClick={async () => console.log(await __testNyaa())}>Test</Button>
        </>
    )
}
