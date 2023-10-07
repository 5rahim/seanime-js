/* -------------------------------------------------------------------------------------------------
 * Preview episode torrents
 * -----------------------------------------------------------------------------------------------*/
import { AniZipData } from "@/lib/anizip/types"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useAtom, useSetAtom } from "jotai/react"
import React, { useMemo } from "react"
import { Slider } from "@/components/shared/slider"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { FcLineChart } from "@react-icons/all-files/fc/FcLineChart"
import { Divider } from "@/components/ui/divider"
import { atom } from "jotai"
import { similarity } from "@/lib/string-similarity"
import { __torrentSearch_selectedTorrentsAtom } from "@/app/(main)/view/_containers/torrent-search/torrent-search-modal"
import { IconButton } from "@/components/ui/button/icon-button"
import { BiX } from "@react-icons/all-files/bi/BiX"

type EpisodeListPreviewProps = {
    aniZipData?: AniZipData
    media: AnilistDetailedMedia
    episodeOffset: number
}
const __torrentSearch_getPreviewTorrentsAtom = atom(
    get => get(__torrentSearch_selectedTorrentsAtom),
    (get, set, payload: { titles: string[], episodeOffset: number }) => {

        // Filter torrents before display
        // Remove torrents that don't have an episode number
        // Remove torrents that don't have a similar media title
        // Sort by episode number

        const selectedTorrents = get(__torrentSearch_selectedTorrentsAtom).filter(n => !!n.parsed.episode)
        const torrentsWithRating = selectedTorrents.map(torrent => {
            const bestMatch = similarity.findBestMatch(torrent.parsed.name, payload.titles)
            return {
                torrent,
                rating: bestMatch.bestMatch.rating,
            }
        })
        const highestRating = Math.max(...torrentsWithRating.map(item => item.rating))
        return torrentsWithRating
            .filter(item => item.rating >= 0.3)
            .filter(item =>
                (item.rating.toFixed(3) === highestRating.toFixed(3)) || Math.abs(+item.rating.toFixed(3) - +highestRating.toFixed(3)) < 0.2,
            ).map(item => {
                const episodeWithOffset = Number(item.torrent.parsed.episode) - payload.episodeOffset
                const isAbsolute = episodeWithOffset > 0
                const episode = isAbsolute ? episodeWithOffset : Number(item.torrent.parsed.episode)
                return {
                    ...item.torrent,
                    episode: episode,
                }
            }).sort((a, b) => a.episode - b.episode)
    },
)

export function EpisodeListPreview(props: EpisodeListPreviewProps) {

    const { media, episodeOffset, ...rest } = props

    const setSelectedTorrents = useSetAtom(__torrentSearch_selectedTorrentsAtom)
    const [_, getSelectedTorrents] = useAtom(__torrentSearch_getPreviewTorrentsAtom)

    const selectedTorrents = useMemo(() => {
        return getSelectedTorrents({
            titles: [media.title?.romaji || "", media.title?.english || "", media.title?.native].filter(Boolean),
            episodeOffset: episodeOffset,
        })
    }, [_, episodeOffset])

    // this is the number of torrents that are not previewed because their parameters are not similar enough
    const previewDiff = _.length - selectedTorrents.length

    if (selectedTorrents.length === 0 || !_.every(n => !!n.parsed.episode)) return null

    return <>
        <div>
            <h3>Preview:</h3>
            {previewDiff > 0 &&
                <p className={"text-sm text-[--muted] italic"}>{previewDiff} torrent(s) not previewed.</p>}
            <p className={"text-sm text-[--muted] italic"}>Note: The preview is not accurate and does not represent the
                final scan. It will only show episode files.</p>
        </div>
        <Slider>
            {selectedTorrents.map(torrent => {
                const episodeData = props.aniZipData?.episodes[String(torrent.episode) || "0"]
                return (
                    <div
                        key={torrent.name}
                        className={"border border-[--border] p-4 rounded-lg relative transition hover:bg-gray-900 w-[400px] flex-none"}
                    >
                        <div className={"absolute top-2 right-2"}>
                            <IconButton
                                icon={<BiX/>}
                                className={"absolute right-2 top-2 rounded-full z-10"}
                                size={"xs"}
                                intent={"gray-outline"}
                                onClick={() => {
                                    setSelectedTorrents(prev => prev.filter(tr => tr.hash !== torrent.hash))
                                }}
                            />
                        </div>
                        <div
                            className={"flex gap-4 relative"}
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
                                <h4 className={"font-medium"}>Episode {torrent.episode}</h4>
                                {!!episodeData &&
                                    <p className={"text-sm text-[--muted] line-clamp-1"}>{episodeData?.title?.en}</p>}
                                <p className={"text-sm line-clamp-1"}>{torrent.name}</p>
                                <div className={"items-center flex gap-1"}>
                                    {torrent.parsed.resolution &&
                                        <Badge intent={torrent.parsed?.resolution?.includes("1080")
                                            ? "warning"
                                            : (torrent.parsed?.resolution?.includes("2160") || torrent.parsed?.resolution?.toLowerCase().includes("4k"))
                                                ? "success"
                                                : "gray"}
                                        >
                                            {torrent.parsed?.resolution}
                                        </Badge>}
                                    {torrent.stats.seeders > 20 ? <Badge intent={"success"} leftIcon={
                                            <FcLineChart/>}>{torrent.stats.seeders}</Badge> :
                                        <Badge intent={"gray"}
                                               leftIcon={<FcLineChart/>}>{torrent.stats.seeders}</Badge>}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </Slider>
        <Divider/>
    </>

}
