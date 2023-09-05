import React, { useCallback, useRef, useState } from "react"
import { Atom } from "jotai"
import { LibraryEntry } from "@/atoms/library/library-entry.atoms"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useSettings } from "@/atoms/settings"
import { useRouter } from "next/navigation"
import { useAtomValue, useSetAtom } from "jotai/react"
import { useStableSelectAtom } from "@/atoms/helpers"
import { useAsyncFn } from "react-use"
import { open } from "@tauri-apps/api/dialog"
import { TorrentManager } from "@/lib/download"
import { FcFolder } from "@react-icons/all-files/fc/FcFolder"
import { Tooltip } from "@/components/ui/tooltip"
import { AiFillPlayCircle } from "@react-icons/all-files/ai/AiFillPlayCircle"
import { BsCollectionPlayFill } from "@react-icons/all-files/bs/BsCollectionPlayFill"
import { Button } from "@/components/ui/button"
import { BiDownload } from "@react-icons/all-files/bi/BiDownload"
import {
    selectedTorrentsAtom,
    sortedSelectedTorrentsAtom,
} from "@/app/(main)/view/_containers/torrent-search/torrent-search-modal"

interface TorrentListProps {
    children?: React.ReactNode
    entryAtom: Atom<LibraryEntry> | undefined
    media: AnilistDetailedMedia,
    onClose: () => void
}

export const TorrentList: React.FC<TorrentListProps> = (props) => {

    const { children, entryAtom, media, ...rest } = props

    const { settings } = useSettings()
    const router = useRouter()
    const setSelectedTorrents = useSetAtom(selectedTorrentsAtom)
    const selectedTorrents = useAtomValue(sortedSelectedTorrentsAtom)
    const sharedPath = useStableSelectAtom(entryAtom, entry => entry.sharedPath)
    const [selectedDir, setSelectedDir] = useState<string | undefined>(sharedPath || settings.library.localDirectory + "\\" + sanitizeDirectoryName(media.title?.romaji || ""))

    const isFile = useCallback((parsed: TorrentInfos) => {
        return !!parsed.episode
    }, [])

    function sanitizeDirectoryName(input: string): string {
        const disallowedChars = /[<>:"/\\|?*\x00-\x1F]/g // Pattern for disallowed characters

        // Replace disallowed characters with an underscore
        const sanitized = input.replace(disallowedChars, " ")

        // Remove leading/trailing spaces and dots (periods) which are not allowed
        const trimmed = sanitized.trim().replace(/^\.+|\.+$/g, "")

        // Ensure the directory name is not empty after sanitization
        return trimmed || "Untitled"
    }

    const [state, selectDir] = useAsyncFn(async () => {
        const selected = await open({
            directory: true,
            multiple: false,
            defaultPath: selectedDir,
        })
        if (selected) {
            setSelectedDir((selected ?? undefined) as string | undefined)
            return selected
        }
    }, [selectedDir])

    const torrentManager = useRef(TorrentManager(settings))


    return <>
        <div>
            <p
                className={"text-sm font-medium flex items-center gap-2 rounded-md border border-[--border] p-2 cursor-pointer mb-2"}
                onClick={async () => {
                    await selectDir()
                }}
            >
                <FcFolder className={"text-2xl"}/>
                {selectedDir}
            </p>
            <div className={"space-y-2"}>
                {selectedTorrents.map(torrent => (
                    <Tooltip trigger={<div
                        className={"flex flex-none ml-12 items-center gap-2 p-2 border border-[--border] rounded-md cursor-pointer hover:bg-gray-800"}
                        key={torrent.name}
                        onClick={() => window.open("https://nyaa.si" + torrent.links.page.replace("#comments", ""), "_blank")}
                    >
                        <span className={"text-lg"}>{isFile(torrent.parsed) ? <AiFillPlayCircle/> :
                            <BsCollectionPlayFill/>}</span>
                        <p className={"truncate text-ellipsis"}>{torrent.name}</p>
                    </div>}>
                        Open on NYAA
                    </Tooltip>
                ))}
            </div>
            <div className={"mt-4 flex w-full justify-end"}>
                {selectedTorrents.length > 0 && <Button
                    leftIcon={<BiDownload/>}
                    intent={"white"}
                    onClick={async () => {
                        if (selectedDir) {
                            await torrentManager.current.addMagnets({
                                magnets: selectedTorrents?.map(n => n.links.magnet) ?? [],
                                savePath: selectedDir,
                            })
                            setSelectedTorrents([])
                            props.onClose()
                            router.push(`/torrents`)
                        }
                    }}
                >Download</Button>}
            </div>
        </div>
    </>

}
