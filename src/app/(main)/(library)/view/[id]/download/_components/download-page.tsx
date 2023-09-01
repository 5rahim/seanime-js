"use client"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { unstable_findNyaaTorrents, unstable_handleSearchTorrents } from "@/lib/download/nyaa/search"
import { SearchTorrent } from "@/lib/download/nyaa/api/types"
import { createDataGridColumns, DataGrid } from "@/components/ui/datagrid"
import rakun from "@/lib/rakun/rakun"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { Atom, atom } from "jotai"
import { useAtom, useAtomValue, useSetAtom } from "jotai/react"
import { useSettings } from "@/atoms/settings"
import { TorrentManager } from "@/lib/download"
import { Divider } from "@/components/ui/divider"
import { useDownloadPageData } from "@/app/(main)/(library)/view/[id]/download/_components/use-download-page-data"
import { Switch } from "@/components/ui/switch"
import { NumberInput } from "@/components/ui/number-input"
import { useDebounce } from "@/hooks/use-debounce"
import { Button, IconButton } from "@/components/ui/button"
import { cn } from "@/components/ui/core"
import { useRouter, useSearchParams } from "next/navigation"
import { useAsyncFn, useMount, useUpdateEffect } from "react-use"
import { Modal } from "@/components/ui/modal"
import { useDisclosure } from "@/hooks/use-disclosure"
import { open } from "@tauri-apps/api/dialog"
import { normalizeMediaEpisode } from "@/lib/anilist/actions"
import { BiLinkExternal } from "@react-icons/all-files/bi/BiLinkExternal"
import { useStableSelectAtom } from "@/atoms/helpers"
import { LibraryEntry } from "@/atoms/library/library-entry.atoms"
import { FcFolder } from "@react-icons/all-files/fc/FcFolder"
import { BsCollectionPlayFill } from "@react-icons/all-files/bs/BsCollectionPlayFill"
import { AiFillPlayCircle } from "@react-icons/all-files/ai/AiFillPlayCircle"
import { Tooltip } from "@/components/ui/tooltip"
import { BiDownload } from "@react-icons/all-files/bi/BiDownload"


interface DownloadPageProps {
    media: AnilistDetailedMedia,
    aniZipData: AniZipData
}

type SearchTorrentData = SearchTorrent & { parsed: TorrentInfos }

const selectedTorrentsAtom = atom<SearchTorrentData[]>([])

const sortedSelectedTorrentsAtom = atom((get) => {
    const torrents = get(selectedTorrentsAtom)
    if (torrents.every(torrent => !!torrent.parsed.episode)) {
        return get(selectedTorrentsAtom)?.sort((a, b) => Number(a.parsed.episode!) - Number(b.parsed.episode!))
    }
    return torrents
})

export function DownloadPage(props: DownloadPageProps) {
    const { settings } = useSettings()

    const {
        entryAtom,
        lastFile,
        downloadInfo,
    } = useDownloadPageData(props.media)

    const searchParams = useSearchParams()
    const episode = searchParams.get("episode")

    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)

    const [torrents, setTorrents] = useState<SearchTorrentData[]>([])
    const [globalFilter, setGlobalFilter] = useState<string>("")

    const [selectedTorrents, setSelectedTorrents] = useAtom(selectedTorrentsAtom)
    const [quickSearchIsBatch, setQuickSearchIsBatch] = useState(downloadInfo.batch || downloadInfo.canBatch)
    const [quickSearchEpisode, setQuickSearchEpisode] = useState(episode ? Number(episode) : downloadInfo.episodeNumbers[0])
    const debouncedEpisode = useDebounce(quickSearchEpisode, 500)

    const [episodeOffset, setEpisodeOffset] = useState(0)

    const drawer = useDisclosure(false)

    useMount(async () => {
        setSelectedTorrents([])
        const object = await normalizeMediaEpisode({
            media: props.media,
            episode: downloadInfo.episodeNumbers[0],
            force: true,
        })
        setEpisodeOffset(object?.offset ?? 0)
        await handleFindNyaaTorrents(object?.offset ?? 0)
    })

    useEffect(() => {
        console.log(downloadInfo)
    }, [downloadInfo]) //TODO Remove

    useUpdateEffect(() => {
        startTransition(() => {
            handleFindNyaaTorrents()
        })
    }, [quickSearchIsBatch, debouncedEpisode])

    const handleFindNyaaTorrents = async (offset?: number) => {
        setIsLoading(true)
        const torrents = await unstable_findNyaaTorrents({
            media: props.media,
            aniZipData: props.aniZipData,
            episode: quickSearchEpisode,
            lastFile: lastFile,
            batch: quickSearchIsBatch,
            offset: offset ?? episodeOffset,
        })
        console.log(torrents)
        setTorrents(torrents?.map(torrent => {
            const parsed = rakun.parse(torrent.name)
            return { ...torrent, parsed }
        }) ?? [])
        setIsLoading(false)
    }

    useUpdateEffect(() => {
        (async () => {
            if (globalFilter.length > 0) {
                setIsFetching(true)
                const searchResult = await unstable_handleSearchTorrents(globalFilter)
                setTorrents(searchResult.map(torrent => {
                    const parsed = rakun.parse(torrent.name)
                    return { ...torrent, parsed }
                }))
                setIsFetching(false)
            } else {
                await handleFindNyaaTorrents()
            }
        })()
    }, [globalFilter])


    const columns = useMemo(() => createDataGridColumns<SearchTorrentData>(() => [
        {
            accessorKey: "name",
            header: "Name",
            cell: info => <div className={"flex items-center gap-2"}>
                <IconButton
                    icon={<BiLinkExternal/>}
                    intent={"primary-basic"}
                    size={"sm"}
                    onClick={() => window.open("https://nyaa.si" + info.row.original.links.page.replace("#comments", ""), "_blank")}
                />
                <span
                    className={cn(
                        "text-[.95rem] truncate text-ellipsis cursor-pointer",
                        {
                            "text-brand-300 font-semibold": selectedTorrents.some(torrent => torrent.id === info.row.original.id),
                        },
                    )}
                    onClick={() => setSelectedTorrents(draft => {
                        if (!draft.find(torrent => torrent.id === info.row.original.id)) {
                            return [...draft, info.row.original]
                        } else {
                            return draft.filter(torrent => torrent.id !== info.row.original.id)
                        }
                    })}
                    // onClick={async () => {
                    //     if(sharedPath) {
                    //         await torrentManager.current.addMagnets({
                    //             magnets: [info.row.original.links.magnet],
                    //             savePath: sharedPath
                    //         })
                    //     }
                    // }}
                >
                    {info.getValue<string>()}
                </span>
            </div>,
            size: 120,
        },
        {
            accessorKey: "file_size_bytes",
            header: "Size",
            cell: info => info.row.original.file_size,
            size: 5,
        },
        {
            id: "_seeders",
            header: "Seeders",
            cell: info => <div className={"text-sm"}>
                {info.row.original.stats.seeders}
            </div>,
            size: 5,
        },
        {
            id: "_quality",
            header: "Quality",
            cell: info => info.row.original?.parsed?.resolution ? <div className={"text-sm"}>
                <Badge intent={info.row.original?.parsed?.resolution?.includes("1080")
                    ? "warning"
                    : (info.row.original?.parsed?.resolution?.includes("2160") || info.row.original?.parsed?.resolution?.toLowerCase().includes("4k"))
                        ? "success"
                        : "gray"}
                >
                    {info.row.original?.parsed?.resolution}
                </Badge>
            </div> : null,
            size: 5,
        },
        {
            id: "_downloads",
            header: "Downloads",
            cell: info => <div className={"text-sm"}>
                {info.row.original.stats.downloaded}
            </div>,
            size: 5,
        },
        {
            accessorKey: "timestamp",
            header: "Date",
            cell: info => <div className={"text-sm"}>
                {formatDistanceToNow(new Date(info.getValue<number>() * 1000), { addSuffix: true })} ({new Date(info.getValue<number>() * 1000).toLocaleDateString()})
            </div>,
            size: 30,
        },
    ]), [torrents, selectedTorrents])


    return (
        <>
            <div className={"space-y-4 mt-8 relative"}>

                {/*<Button onClick={handleFindNyaaTorrents}>Search torrents</Button>*/}
                {/*<Button onClick={async () => {*/}
                {/*    console.log(await torrentManager.current.getAllTorrents())*/}
                {/*}}>Test add magnet</Button>*/}

                {selectedTorrents.length > 0 && <div className={"absolute top-0 right-0 z-10"}>
                    <Button onClick={drawer.open}>View selected torrents ({selectedTorrents.length})</Button>
                </div>}

                <div>
                    Episode to
                    download: {downloadInfo.episodeNumbers.slice(0, 12).join(", ")}{downloadInfo.episodeNumbers.length > 12 ? ", ..." : "."}
                </div>

                <div className={"space-y-2"}>
                    <h4>Quick search parameters</h4>
                    <div className={"inline-flex gap-4 items-center"}>
                        <Switch label={"Look for batches"} checked={quickSearchIsBatch}
                                onChange={setQuickSearchIsBatch} labelClassName={"text-md"}/>
                        <NumberInput label={"Episode number"} value={quickSearchEpisode} onChange={(value) => {
                            startTransition(() => {
                                setQuickSearchEpisode(value)
                            })
                        }} discrete size="sm" fieldClassName={"flex items-center justify-center gap-3 space-y-0"}
                                     fieldLabelClassName={"flex-none self-center font-normal !text-md sm:text-md lg:text-md"}/>
                    </div>
                </div>

                <Divider/>
                {/*<EpisodeList aniZipData={props.aniZipData} media={props.media}/>*/}

                <DataGrid<SearchTorrentData>
                    columns={columns}
                    data={torrents.slice(0, 20)}
                    rowCount={torrents?.length ?? 0}
                    initialState={{
                        pagination: {
                            pageSize: 20,
                            pageIndex: 0,
                        },
                    }}
                    tdClassName={"py-4 data-[row-selected=true]:bg-gray-900"}
                    tableBodyClassName={"bg-transparent"}
                    footerClassName={"hidden"}
                    state={{
                        globalFilter,
                    }}
                    enableManualFiltering={true}
                    onGlobalFilterChange={setGlobalFilter}
                    isLoading={isLoading && !isFetching}
                    isDataMutating={isFetching}
                    globalSearchInputProps={{
                        // placeholder:
                    }}
                />


            </div>

            <Modal isOpen={drawer.isOpen} onClose={drawer.close} size={"xl"} isClosable title={"Torrents"}>
                <TorrentList entryAtom={entryAtom} onClose={drawer.close} media={props.media}/>
            </Modal>
        </>
    )
}

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
                            router.push(`/download`)
                        }
                    }}
                >Download</Button>}
            </div>
        </div>
    </>

}

interface EpisodeListProps {
    children?: React.ReactNode
    aniZipData?: AniZipData
    media: AnilistDetailedMedia
}

export const EpisodeList: React.FC<EpisodeListProps> = (props) => {

    const { children, media, ...rest } = props

    const selectedTorrents = useAtomValue(sortedSelectedTorrentsAtom)

    if (selectedTorrents.length === 0 || !selectedTorrents.every(n => !!n.parsed.episode)) return null

    return <>
        <h3>Preview:</h3>
        <div className={"grid grid-cols-1 sm:grid-cols-2 gap-4"}>
            {selectedTorrents.map(torrent => {
                const episodeData = props.aniZipData?.episodes[torrent.parsed.episode || "0"]
                return (
                    <div key={torrent.name}
                         className={"border border-[--border] p-4 pr-12 rounded-lg relative transition hover:bg-gray-900"}>
                        <div
                            className={"flex gap-4 relative cursor-pointer"}
                        >
                            {episodeData?.image && <div
                                className="h-24 w-24 flex-none rounded-md object-cover object-center relative overflow-hidden">
                                <Image
                                    src={episodeData?.image}
                                    alt={""}
                                    fill
                                    quality={60}
                                    priority
                                    sizes="10rem"
                                    className="object-cover object-center"
                                />
                            </div>}

                            <div className={"space-y-1"}>
                                <h4 className={"font-medium"}>Episode {torrent.parsed.episode}</h4>
                                {!!episodeData && <p className={"text-sm text-[--muted]"}>{episodeData?.title?.en}</p>}
                                {torrent.parsed.resolution && <Badge>{torrent.parsed.resolution}</Badge>}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
        <Divider/>
    </>

}
