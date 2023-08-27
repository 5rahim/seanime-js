"use client"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import React, { startTransition, useEffect, useMemo, useRef, useState } from "react"
import { unstable_findNyaaTorrents, unstable_handleSearchTorrents } from "@/lib/download/nyaa/search"
import { SearchTorrent } from "@/lib/download/nyaa/api/types"
import { createDataGridColumns, DataGrid } from "@/components/ui/datagrid"
import rakun from "@/lib/rakun/rakun"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { atom } from "jotai"
import { useAtom, useAtomValue } from "jotai/react"
import { useSettings } from "@/atoms/settings"
import { TorrentManager } from "@/lib/download"
import { Divider } from "@/components/ui/divider"
import { useDownloadPageData } from "@/app/(main)/(library)/view/[id]/download/_components/use-download-page-data"
import { Switch } from "@/components/ui/switch"
import { NumberInput } from "@/components/ui/number-input"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { cn } from "@/components/ui/core"
import { useSearchParams } from "next/navigation"
import { useMount, useUpdateEffect } from "react-use"
import { Drawer } from "@/components/ui/modal"
import { useDisclosure } from "@/hooks/use-disclosure"


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
        sharedPath,
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

    const drawer = useDisclosure(false)

    // const sharedPath = useMemo(() => {
    //     return !!entryAtom ? useSelectAtom(entryAtom, entry => entry.sharedPath) : (
    //         settings.library.localDirectory + "\\" + props.media.title?.userPreferred
    //     )
    // }, [entryAtom])

    useMount(() => {
        setSelectedTorrents([])
        handleFindNyaaTorrents()
    })

    useEffect(() => {
        console.log(downloadInfo)
    }, [downloadInfo]) //TODO Remove

    useUpdateEffect(() => {
        startTransition(() => {
            handleFindNyaaTorrents()
        })
    }, [quickSearchIsBatch, debouncedEpisode])

    const handleFindNyaaTorrents = async () => {
        setIsLoading(true)
        const torrents = await unstable_findNyaaTorrents({
            media: props.media,
            aniZipData: props.aniZipData,
            episode: quickSearchEpisode,
            lastFile: lastFile,
            batch: quickSearchIsBatch,
        })
        console.log(torrents)
        setTorrents(torrents.map(torrent => {
            const parsed = rakun.parse(torrent.name)
            return { ...torrent, parsed }
        }))
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

    const torrentManager = useRef(TorrentManager(settings))

    const columns = useMemo(() => createDataGridColumns<SearchTorrentData>(() => [
        {
            accessorKey: "name",
            header: "Name",
            cell: info => <div
                className={cn(
                    "text-[.95rem] truncate text-ellipsis cursor-pointer",
                    {
                        "text-brand-300": selectedTorrents.some(torrent => torrent.id === info.row.original.id),
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
                    download: {downloadInfo.episodeNumbers.slice(0, 12).join(", ")}{downloadInfo.episodeNumbers.length > 12 ? ", ..." : " ."}
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

            <Drawer isOpen={drawer.isOpen} onClose={drawer.close} size={"xl"} isClosable title={"Torrents"}>
                <div>
                    <p className={"flex-none"}>{sharedPath}</p>
                    {selectedTorrents.map(torrent => (
                        <div className={"flex flex-none pl-6"}>
                            <p className={"truncate text-ellipsis"}>{torrent.name}</p>
                        </div>
                    ))}
                </div>
            </Drawer>
        </>
    )
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
