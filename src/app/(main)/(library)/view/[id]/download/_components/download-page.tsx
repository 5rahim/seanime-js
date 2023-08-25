"use client"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useSelectAtom } from "@/atoms/helpers"
import { useLibraryEntryAtomByMediaId } from "@/atoms/library/library-entry.atoms"
import { useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist-collection"
import React, { startTransition, useEffect, useMemo, useRef, useState } from "react"
import { useLocalFilesByMediaId } from "@/atoms/library/local-file.atoms"
import { getMediaDownloadInfo } from "@/lib/download/helpers"
import { unstable_findNyaaTorrents, unstable_handleSearchTorrents } from "@/lib/download/nyaa/search"
import { SearchTorrent } from "@/lib/download/nyaa/api/types"
import { createDataGridColumns, DataGrid } from "@/components/ui/datagrid"
import rakun from "@/lib/rakun/rakun"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { atom } from "jotai"
import { useAtomValue, useSetAtom } from "jotai/react"
import { useSettings } from "@/atoms/settings"
import { TorrentManager } from "@/lib/download/qbittorrent"
import { Divider } from "@/components/ui/divider"

interface DownloadPageProps {
    media: AnilistDetailedMedia,
    aniZipData: AniZipData
}

type SearchTorrentData = SearchTorrent & { parsed: TorrentInfos }

const selectedTorrentsAtom = atom<SearchTorrentData[]>([])

const sortedSelectedTorrentsAtom = atom((get) => {
    const torrents = get(selectedTorrentsAtom)
    if (torrents.every(torrent => !!torrent.parsed.episode)) {
        return get(selectedTorrentsAtom).sort((a, b) => Number(a.parsed.episode!) - Number(b.parsed.episode!))
    }
    return torrents
})

export function DownloadPage(props: DownloadPageProps) {
    const { settings } = useSettings()

    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(props.media.id)
    const collectionEntryProgress = !!collectionEntryAtom ? useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress) : undefined
    const collectionEntryStatus = !!collectionEntryAtom ? useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status) : undefined
    const entryAtom = useLibraryEntryAtomByMediaId(props.media.id)

    const sharedPath = !!entryAtom ? useSelectAtom(entryAtom, entry => entry.sharedPath) : undefined // TODO: Create a shared path based on title

    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)

    const files = useLocalFilesByMediaId(props.media.id)
    const [episodeFiles] = useState(files.filter(file => !!file.parsedInfo?.episode).filter(Boolean))
    const [lastFile] = useState(episodeFiles.length > 1 ? episodeFiles.reduce((prev, curr) => Number(prev!.parsedInfo!.episode!) > Number(curr!.parsedInfo!.episode!) ? prev : curr) : episodeFiles[0] ?? undefined)

    const [torrents, setTorrents] = useState<SearchTorrentData[]>([])
    const [globalFilter, setGlobalFilter] = useState<string>("")
    const setSelectedTorrents = useSetAtom(selectedTorrentsAtom)

    const [downloadInfo] = useState(getMediaDownloadInfo({
        media: props.media,
        lastEpisodeFile: lastFile,
        progress: collectionEntryProgress,
        libraryEntryExists: !!entryAtom,
        status: collectionEntryStatus,
    }))

    useEffect(() => {
        setSelectedTorrents([])
    }, [])

    useEffect(() => {
        console.log(downloadInfo)
    }, [downloadInfo]) //TODO Remove


    // useEffect(() => {
    //     (async () => {
    //         console.log(await __testNyaa())
    //     })()
    // }, [])

    const handleFindNyaaTorrents = async () => {
        setIsLoading(true)
        // console.log(downloadInfo)
        const torrents = await unstable_findNyaaTorrents({
            media: props.media,
            aniZipData: props.aniZipData,
            episode: downloadInfo.episodeNumbers[0],
            lastFile: lastFile,
            batch: downloadInfo.batch || downloadInfo.canBatch,
        })
        console.log(torrents)
        setTorrents(torrents.map(torrent => {
            const parsed = rakun.parse(torrent.name)
            return { ...torrent, parsed }
        }))
        setIsLoading(false)
    }

    useEffect(() => {
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
                className={"text-[.95rem] truncate text-ellipsis cursor-pointer"}
                // onClick={() => window.open(info.row.original.links.magnet, "_blank")}
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
    ]), [torrents])


    return (
        <>
            <div className={"space-y-4 mt-8"}>

                {/*<Button onClick={handleFindNyaaTorrents}>Search torrents</Button>*/}
                {/*<Button onClick={async () => {*/}
                {/*    console.log(await torrentManager.current.getAllTorrents())*/}
                {/*}}>Test add magnet</Button>*/}

                <EpisodeList aniZipData={props.aniZipData} media={props.media}/>

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
                    enableRowSelection={true}
                    rowSelectionPrimaryKey={"name"}
                    onRowSelect={event => {
                        startTransition(() => {
                            console.log(event.data)
                            setSelectedTorrents(event.data)
                            // setSelectedTorrents(event.data)
                        })
                    }}
                    enablePersistentRowSelection={true}
                    state={{
                        globalFilter,
                    }}
                    enableManualFiltering={true}
                    onGlobalFilterChange={setGlobalFilter}
                    isLoading={isLoading && !isFetching}
                    isDataMutating={isFetching}
                />


            </div>
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
        <div className={"grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"}>
            {selectedTorrents.map(torrent => {
                // const episode = useNormalizedEpisodeNumber(torrent.parsed, media)
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
