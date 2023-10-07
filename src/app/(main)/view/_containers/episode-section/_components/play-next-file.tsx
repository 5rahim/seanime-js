import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSearchParam } from "react-use"

export function PlayNextFile({ path, playFile }: {
    path: string | null
    playFile: (value: string) => Promise<void>
}) {

    const router = useRouter()
    const pathname = usePathname()
    const playNext = useSearchParam("playNext")

    useEffect(() => {
        // Automatically play the next episode if param is present in URL
        const t = setTimeout(() => {
            if (playNext && path) {
                router.replace(pathname)
                playFile(path).then()
            }
        }, 500)

        return () => clearTimeout(t)
    }, [])

    return null
}
