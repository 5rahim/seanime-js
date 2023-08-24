"use client"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useSelectAtom } from "@/atoms/helpers"
import { useLibraryEntryAtomByMediaId } from "@/atoms/library/library-entry.atoms"
import { useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist-collection"
import { useMemo, useState } from "react"
import { useLocalFilesByMediaId } from "@/atoms/library/local-file.atoms"
import { Button } from "@/components/ui/button"
import { getMediaDownloadInfo } from "@/lib/download/helpers"
import { unstable_findNyaaTorrents } from "@/lib/download/nyaa/search"
import { SearchTorrent } from "@/lib/download/nyaa/api/types"
import { createDataGridColumns, DataGrid } from "@/components/ui/datagrid"
import rakun from "@/lib/rakun/rakun"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface DownloadPageProps {
    media: AnilistDetailedMedia,
    aniZipData: AniZipData
}

type SearchTorrentData = SearchTorrent & { parsed: TorrentInfos }

export function DownloadPage(props: DownloadPageProps) {

    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(props.media.id)
    const collectionEntryProgress = !!collectionEntryAtom ? useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress) : undefined
    const collectionEntryStatus = !!collectionEntryAtom ? useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.status) : undefined
    const entryAtom = useLibraryEntryAtomByMediaId(props.media.id)

    const files = useLocalFilesByMediaId(props.media.id)
    const [episodeFiles] = useState(files.filter(file => !!file.parsedInfo?.episode).filter(Boolean))
    const [lastFile] = useState(episodeFiles.length > 1 ? episodeFiles.reduce((prev, curr) => Number(prev!.parsedInfo!.episode!) > Number(curr!.parsedInfo!.episode!) ? prev : curr) : episodeFiles[0] ?? undefined)

    const [torrents, setTorrents] = useState<SearchTorrentData[]>([])

    const [downloadInfo] = useState(getMediaDownloadInfo({
        media: props.media,
        lastEpisodeFile: lastFile,
        progress: collectionEntryProgress,
        libraryEntryExists: !!entryAtom,
        status: collectionEntryStatus,
    }))


    // useEffect(() => {
    //     (async () => {
    //         console.log(await __testNyaa())
    //     })()
    // }, [])

    const handleFindNyaaTorrents = async () => {
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
    }

    const columns = useMemo(() => createDataGridColumns<SearchTorrentData>(() => [
        {
            accessorKey: "name",
            header: "Name",
            cell: info => <div className={"text-[.95rem] truncate text-ellipsis"}>
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
            cell: info => <div className={"text-sm"}>
                <Badge intent={info.row.original?.parsed?.resolution?.includes("1080") ? "warning" : "gray"}>
                    {info.row.original?.parsed?.resolution}
                </Badge>
            </div>,
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
        <div className={"space-y-4"}>
            <Button onClick={handleFindNyaaTorrents}>Search torrents</Button>
            <DataGrid<SearchTorrentData>
                columns={columns}
                data={torrents}
                rowCount={torrents?.length ?? 0}
                initialState={{
                    pagination: {
                        pageSize: 10,
                        pageIndex: 0,
                    },
                }}
                tdClassName={"py-4"}
                tableBodyClassName={"bg-transparent"}
                // isLoading={!clientData}
            />
        </div>
    )
}
