import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSearchParam } from "react-use"

type Props = {
    path: string | undefined
    playFile: (value: string) => Promise<void>
}

export function PlayNextFile({ path, playFile }: Props) {

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
