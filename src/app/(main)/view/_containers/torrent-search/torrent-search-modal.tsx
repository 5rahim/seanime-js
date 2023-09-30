"use client"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import React, { startTransition, useMemo, useState } from "react"
import { unstable_findNyaaTorrents, unstable_handleSearchTorrents } from "@/lib/download/nyaa/search"
import { SearchTorrent } from "@/lib/download/nyaa/api/types"
import { createDataGridColumns, DataGrid } from "@/components/ui/datagrid"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { atom } from "jotai"
import { useAtom, useAtomValue } from "jotai/react"
import { Divider } from "@/components/ui/divider"
import { Switch } from "@/components/ui/switch"
import { NumberInput } from "@/components/ui/number-input"
import { useDebounce } from "@/hooks/use-debounce"
import { Button, IconButton } from "@/components/ui/button"
import { cn } from "@/components/ui/core"
import { useMount, useSearchParam } from "react-use"
import { Drawer, Modal } from "@/components/ui/modal"
import { useDisclosure } from "@/hooks/use-disclosure"
import { BiLinkExternal } from "@react-icons/all-files/bi/BiLinkExternal"
import { useMediaDownloadInfo } from "@/lib/download/helpers"
import {
    TorrentSearchTorrentList,
} from "@/app/(main)/view/_containers/torrent-search/_components/torrent-search-torrent-list"
import { useQuery } from "@tanstack/react-query"
import rakun from "@/lib/rakun"
import { atomWithImmer } from "jotai-immer"
import { SearchTorrentData } from "@/lib/download/types"
import { Tooltip } from "@/components/ui/tooltip"
import { extractHashFromMagnetLink } from "@/lib/download/torrent-helpers"
import { usePathname, useRouter } from "next/navigation"
import { useSettings } from "@/atoms/settings"

interface Props {
    media: AnilistDetailedMedia,
    aniZipData?: AniZipData
}

export const __torrentSearch_selectedTorrentsAtom = atom<SearchTorrentData[]>([])

export const __torrentSearch_isOpenAtom = atomWithImmer<{ isOpen: boolean, episode: number | undefined }>({
    isOpen: false,
    episode: undefined,
})

export const __torrentSearch_sortedSelectedTorrentsAtom = atom((get) => {
    const torrents = get(__torrentSearch_selectedTorrentsAtom)
    if (torrents.every(torrent => !!torrent.parsed.episode)) { // Sort torrents if they all contain an episode number
        return get(__torrentSearch_selectedTorrentsAtom)?.sort((a, b) => Number(a.parsed.episode!) - Number(b.parsed.episode!))
    }
    return torrents
})

export function TorrentSearchModal(props: Props) {

    const [status, setStatus] = useAtom(__torrentSearch_isOpenAtom)
    const _downloadParam = useSearchParam("download")
    const router = useRouter()
    const pathname = usePathname()
    const { settings } = useSettings()

    useMount(() => {
        if (_downloadParam && !isNaN(parseInt(_downloadParam))) {
            setStatus({
                isOpen: true,
                episode: Number(_downloadParam),
            })
            router.replace(pathname)
        } else {
            setStatus({
                isOpen: false,
                episode: undefined,
            })
        }
    })

    return <Drawer
        isOpen={status.isOpen}
        onClose={() => setStatus(draft => {
            draft.isOpen = false
            return
        })}
        title={"Torrent search"}
        isClosable
        size={"2xl"}
    >
        {!settings.library.localDirectory ? <p>Your local library is not configured</p> :
            <Content media={props.media} aniZipData={props.aniZipData}/>}

    </Drawer>

}

export const Content = ({ media, aniZipData }: { media: AnilistDetailedMedia, aniZipData?: AniZipData }) => {


    const {
        entryAtom,
        latestFile,
        downloadInfo,
    } = useMediaDownloadInfo(media)
    const { episode } = useAtomValue(__torrentSearch_isOpenAtom)

    const [globalFilter, setGlobalFilter] = useState<string>("")

    const [selectedTorrents, setSelectedTorrents] = useAtom(__torrentSearch_selectedTorrentsAtom)
    const [quickSearchIsBatch, setQuickSearchIsBatch] = useState<boolean>(downloadInfo.batch || downloadInfo.canBatch)
    const [quickSearchEpisode, setQuickSearchEpisode] = useState<number | undefined>(episode || downloadInfo.episodeNumbers[0])
    const debouncedEpisode = useDebounce(quickSearchEpisode, 500)

    const episodeOffset = useMemo(() => aniZipData?.episodes?.["1"]?.absoluteEpisodeNumber ? aniZipData?.episodes?.["1"]?.absoluteEpisodeNumber - 1 : undefined, [aniZipData?.episodes?.["1"]?.absoluteEpisodeNumber])

    const torrentListModal = useDisclosure(false)

    useMount(() => {
        setSelectedTorrents([])
    })


    const { data: torrents, isLoading, isFetching } = useQuery<SearchTorrentData[]>(
        ["fetching-torrents", media.id, debouncedEpisode, globalFilter, quickSearchIsBatch, episodeOffset],
        async () => {
            let res: SearchTorrent[] | undefined = undefined
            if (globalFilter.length === 0) {
                res = await unstable_findNyaaTorrents({
                    media: media,
                    aniZipData: aniZipData!,
                    episode: quickSearchEpisode!,
                    latestFile: latestFile,
                    batch: quickSearchIsBatch,
                    offset: episodeOffset || 0,
                })
            } else {
                res = await unstable_handleSearchTorrents(globalFilter)
            }
            return (res?.map(torrent => {
                return {
                    ...torrent,
                    parsed: rakun.parse(torrent.name),
                    hash: extractHashFromMagnetLink(torrent.links.magnet),
                }
            }) || []).filter(torrent => {
                // If this isn't a batch search, remove torrents that don't have episodes parsed
                if (!quickSearchIsBatch && !torrent.parsed.episode) return false
                return true
            }) as SearchTorrentData[]
        }, {
            keepPreviousData: false,
            refetchOnWindowFocus: false,
            retry: 5,
            enabled: !!aniZipData && quickSearchEpisode !== undefined,
        })


    const columns = useMemo(() => createDataGridColumns<SearchTorrentData>(() => [
        {
            accessorKey: "name",
            header: "Name",
            cell: info => <div className={"flex items-center gap-2"}>
                <Tooltip trigger={<IconButton
                    icon={<BiLinkExternal/>}
                    intent={"primary-basic"}
                    size={"sm"}
                    onClick={() => window.open("https://nyaa.si" + info.row.original.links.page.replace("#comments", ""), "_blank")}
                />}>View on NYAA</Tooltip>
                <Tooltip
                    trigger={
                        <div
                            className={cn(
                                "text-[.95rem] truncate text-ellipsis cursor-pointer max-w-[90%] overflow-hidden",
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
                        >
                            {info.getValue<string>()}
                        </div>}
                >
                    {info.getValue<string>()}
                </Tooltip>
            </div>,
            size: 100,
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
            size: 50,
        },
    ]), [torrents, selectedTorrents])

    if (!downloadInfo || !media) return <></>

    return (
        <>
            <div className={"space-y-4 relative"}>

                {selectedTorrents.length > 0 && <div className={"absolute top-0 right-0 z-10"}>
                    <Button onClick={torrentListModal.open}>View selected torrents ({selectedTorrents.length})</Button>
                </div>}

                {(media.format !== "MOVIE" && media.episodes !== 1) && <>
                    <div>
                        Episodes to
                        download: {downloadInfo.episodeNumbers.slice(0, 12).join(", ")}{downloadInfo.episodeNumbers.length > 12 ? ", ..." : "."}
                    </div>
                    {!!(episodeOffset && episodeOffset > 0) && <div>
                        Absolute episode
                        numbers: {downloadInfo.episodeNumbers.slice(0, 12).map(n => n + episodeOffset).join(", ")}{downloadInfo.episodeNumbers.length > 12 ? ", ..." : "."}
                    </div>}
                </>}

                <div className={"space-y-2"}>
                    <h4>Quick search parameters</h4>
                    <div className={"inline-flex gap-4 items-center"}>
                        <Switch
                            label={"Look for batches"}
                            checked={quickSearchIsBatch}
                            onChange={setQuickSearchIsBatch}
                            labelClassName={"text-md"}
                        />
                        <NumberInput
                            label={"Episode number"}
                            value={quickSearchEpisode}
                            onChange={(value) => {
                                startTransition(() => {
                                    setQuickSearchEpisode(value)
                                })
                            }}
                            discrete
                            size="sm"
                            fieldClassName={"flex items-center justify-center gap-3 space-y-0"}
                            fieldLabelClassName={"flex-none self-center font-normal !text-md sm:text-md lg:text-md"}/>
                    </div>
                </div>

                <Divider/>
                {/*<EpisodeList aniZipData={props.aniZipData} media={props.media}/>*/}

                <DataGrid<SearchTorrentData>
                    columns={columns}
                    data={torrents?.slice(0, 20)}
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
                    isLoading={isLoading || isFetching}
                    isDataMutating={isFetching}
                    globalSearchInputProps={{
                        // placeholder:
                    }}
                />


            </div>

            <Modal isOpen={torrentListModal.isOpen} onClose={torrentListModal.close} size={"2xl"} isClosable
                   title={"Torrents"}>
                <TorrentSearchTorrentList
                    entryAtom={entryAtom}
                    onClose={torrentListModal.close}
                    media={media}
                    downloadInfo={downloadInfo}
                />
            </Modal>
        </>
    )

}

// interface EpisodeListProps {
//     children?: React.ReactNode
//     aniZipData?: AniZipData
//     media: AnilistDetailedMedia
// }
//
// export const EpisodeList: React.FC<EpisodeListProps> = (props) => {
//
//     const { children, media, ...rest } = props
//
//     const selectedTorrents = useAtomValue(sortedSelectedTorrentsAtom)
//
//     if (selectedTorrents.length === 0 || !selectedTorrents.every(n => !!n.parsed.episode)) return null
//
//     return <>
//         <h3>Preview:</h3>
//         <div className={"grid grid-cols-1 sm:grid-cols-2 gap-4"}>
//             {selectedTorrents.map(torrent => {
//                 const episodeData = props.aniZipData?.episodes[torrent.parsed.episode || "0"]
//                 return (
//                     <div key={torrent.name}
//                          className={"border border-[--border] p-4 pr-12 rounded-lg relative transition hover:bg-gray-900"}>
//                         <div
//                             className={"flex gap-4 relative cursor-pointer"}
//                         >
//                             {episodeData?.image && <div
//                                 className="h-24 w-24 flex-none rounded-md object-cover object-center relative overflow-hidden">
//                                 <Image
//                                     src={episodeData?.image}
//                                     alt={""}
//                                     fill
//                                     quality={60}
//                                     priority
//                                     sizes="10rem"
//                                     className="object-cover object-center"
//                                 />
//                             </div>}
//
//                             <div className={"space-y-1"}>
//                                 <h4 className={"font-medium"}>Episode {torrent.parsed.episode}</h4>
//                                 {!!episodeData && <p className={"text-sm text-[--muted]"}>{episodeData?.title?.en}</p>}
//                                 {torrent.parsed.resolution && <Badge>{torrent.parsed.resolution}</Badge>}
//                             </div>
//                         </div>
//                     </div>
//                 )
//             })}
//         </div>
//         <Divider/>
//     </>
//
// }
