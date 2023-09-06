"use client"
import React, { useMemo } from "react"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { BiCalendarAlt } from "@react-icons/all-files/bi/BiCalendarAlt"
import _ from "lodash"
import { ScoreProgressBadges } from "@/app/(main)/view/_containers/meta-section/_components/score-progress-badges"
import { NextAiringEpisode } from "@/app/(main)/view/_containers/meta-section/_components/next-airing-episode"
import { TorrentDownloadButton } from "@/app/(main)/view/_containers/meta-section/_components/torrent-download-button"
import { useLibraryEntryAtomByMediaId } from "@/atoms/library/library-entry.atoms"
import { useAnilistCollectionEntryAtomByMediaId } from "@/atoms/anilist/entries.atoms"
import { AnilistMediaEntryModal } from "@/components/shared/anilist-media-entry-modal"
import { Badge } from "@/components/ui/badge"
import { Accordion } from "@/components/ui/accordion"
import Image from "next/image"
import Link from "next/link"
import { BiHeart } from "@react-icons/all-files/bi/BiHeart"
import { AiFillStar } from "@react-icons/all-files/ai/AiFillStar"
import { AiOutlineStar } from "@react-icons/all-files/ai/AiOutlineStar"
import { AiOutlineHeart } from "@react-icons/all-files/ai/AiOutlineHeart"
import { Button } from "@/components/ui/button"
import { useStableSelectAtom } from "@/atoms/helpers"
import { AiFillPlayCircle } from "@react-icons/all-files/ai/AiFillPlayCircle"

interface MetaSectionProps {
    children?: React.ReactNode
    detailedMedia: AnilistDetailedMedia
}

export const MetaSection: React.FC<MetaSectionProps> = (props) => {

    const { children, detailedMedia, ...rest } = props

    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(detailedMedia.id)
    const entryAtom = useLibraryEntryAtomByMediaId(detailedMedia.id)
    const progress = useStableSelectAtom(collectionEntryAtom, entry => entry?.progress)

    const nextEpisode = useMemo(() => {
        if (!!detailedMedia.nextAiringEpisode?.episode) {
            return progress ? (progress + 1 <= detailedMedia.nextAiringEpisode.episode - 1 ? progress + 1 : detailedMedia.nextAiringEpisode.episode - 1) : 1
        } else {
            return progress ? (progress + 1 <= detailedMedia.episodes! ? progress + 1 : 1) : 1
        }
    }, [])

    const relations = (detailedMedia.relations?.edges?.map(edge => edge) || [])
        .filter(Boolean)
        .filter(n => (n.node?.format === "TV" || n.node?.format === "OVA" || n.node?.format === "MOVIE") && (n.relationType === "PREQUEL" || n.relationType === "SEQUEL" || n.relationType === "PARENT" || n.relationType === "SIDE_STORY" || n.relationType === "ALTERNATIVE" || n.relationType === "ADAPTATION"))

    const seasonMostPopular = detailedMedia.rankings?.find(r => (!!r?.season || !!r?.year) && r?.type === "POPULAR" && r.rank <= 10)
    const allTimeHighestRated = detailedMedia.rankings?.find(r => !!r?.allTime && r?.type === "RATED" && r.rank <= 100)
    const seasonHighestRated = detailedMedia.rankings?.find(r => (!!r?.season || !!r?.year) && r?.type === "RATED" && r.rank <= 5)
    const allTimeMostPopular = detailedMedia.rankings?.find(r => !!r?.allTime && r?.type === "POPULAR" && r.rank <= 100)

    return (
        <div className={"space-y-8 pb-10"}>
            <div className={"space-y-8 p-8 rounded-xl bg-gray-900 bg-opacity-80 drop-shadow-md relative"}>
                <div className={"space-y-4"}>

                    {/*TITLE*/}
                    <div className={"space-y-2"}>
                        <h1 className={"[text-shadow:_0_1px_10px_rgb(0_0_0_/_20%)]"}>{detailedMedia.title?.userPreferred}</h1>
                        {detailedMedia.title?.userPreferred?.toLowerCase() !== detailedMedia.title?.english?.toLowerCase() &&
                            <h4 className={"text-gray-400"}>{detailedMedia.title?.english}</h4>}
                    </div>

                    {/*SEASON*/}
                    {!!detailedMedia.season ? (
                            <div>
                                <p className={"text-lg text-gray-200 flex w-full gap-1 items-center"}>
                                    <BiCalendarAlt/> {new Intl.DateTimeFormat("en-US", {
                                    year: "numeric",
                                    month: "short",
                                }).format(new Date(detailedMedia.startDate?.year || 0, detailedMedia.startDate?.month || 0))} - {_.capitalize(detailedMedia.season ?? "")}
                                </p>
                            </div>
                        ) :
                        (
                            <p className={"text-lg text-gray-200 flex w-full gap-1 items-center"}>
                                Not yet released
                            </p>
                        )}

                    {/*PROGRESS*/}
                    <div className={"flex gap-4 items-center"}>
                        {collectionEntryAtom &&
                            <ScoreProgressBadges collectionEntryAtom={collectionEntryAtom}
                                                 episodes={detailedMedia.episodes}/>
                        }
                        <AnilistMediaEntryModal media={detailedMedia}/>
                    </div>

                    <p className={"max-h-24 overflow-y-auto"}>{detailedMedia.description?.replace(/(<([^>]+)>)/ig, "")}</p>

                    {/*STUDIO*/}
                    {!!detailedMedia.studios?.edges?.[0] && <div>
                        <span className={"font-bold"}>Studio </span>
                        <Badge
                            className={"ml-2"} size={"lg"}
                            intent={"gray"}
                            badgeClassName={"rounded-md"}
                        >
                            {detailedMedia.studios?.edges?.[0]?.node?.name}
                        </Badge>
                    </div>}


                    {/*BADGES*/}
                    <div className={"items-center flex"}>
                        {detailedMedia.meanScore && (
                            <Badge
                                className={"mr-2"}
                                size={"lg"}
                                intent={detailedMedia.meanScore >= 70 ? detailedMedia.meanScore >= 85 ? "primary" : "success" : "warning"}
                                leftIcon={<BiHeart/>}
                            >{detailedMedia.meanScore / 10}</Badge>
                        )}
                        {detailedMedia.genres?.map(genre => {
                            return <Badge key={genre!} className={"mr-2"} size={"lg"}>{genre}</Badge>
                        })}
                    </div>

                    {/*AWARDS*/}
                    {(!!allTimeHighestRated || !!seasonMostPopular) && <div className={"flex flex-wrap gap-2"}>
                        {allTimeHighestRated && <Badge
                            className={""} size={"lg"}
                            intent={"gray"}
                            leftIcon={<AiFillStar/>}
                            iconClassName={"text-yellow-500"}
                            badgeClassName={"rounded-md"}
                        >
                            #{String(allTimeHighestRated.rank)} Highest
                            Rated {allTimeHighestRated.format !== "TV" ? `${allTimeHighestRated.format}` : ""} of All
                            Time
                        </Badge>}
                        {seasonHighestRated && <Badge
                            className={""} size={"lg"}
                            intent={"gray"}
                            leftIcon={<AiOutlineStar/>}
                            iconClassName={"text-yellow-500"}
                            badgeClassName={"rounded-md"}
                        >
                            #{String(seasonHighestRated.rank)} Highest
                            Rated {seasonHighestRated.format !== "TV" ? `${seasonHighestRated.format}` : ""} of {_.capitalize(seasonHighestRated.season!)} {seasonHighestRated.year}
                        </Badge>}
                        {seasonMostPopular && <Badge
                            className={""} size={"lg"}
                            intent={"gray"}
                            leftIcon={<AiOutlineHeart/>}
                            iconClassName={"text-pink-500"}
                            badgeClassName={"rounded-md"}
                        >
                            #{(String(seasonMostPopular.rank))} Most
                            Popular {seasonMostPopular.format !== "TV" ? `${seasonMostPopular.format}` : ""} of {_.capitalize(seasonMostPopular.season!)} {seasonMostPopular.year}
                        </Badge>}
                        {/*{allTimeMostPopular && <Badge*/}
                        {/*    className={""} size={"lg"}*/}
                        {/*    intent={"gray"}*/}
                        {/*    leftIcon={<AiFillHeart />}*/}
                        {/*    iconClassName={"text-pink-700"}*/}
                        {/*    badgeClassName={"rounded-md"}*/}
                        {/*>*/}
                        {/*    #{allTimeMostPopular.rank} most popular of all time*/}
                        {/*</Badge>}*/}
                    </div>}

                </div>

                {detailedMedia.status !== "NOT_YET_RELEASED" && (
                    <TorrentDownloadButton
                        entryAtom={entryAtom}
                        collectionEntryAtom={collectionEntryAtom}
                        detailedMedia={detailedMedia}
                    />
                )}

                {detailedMedia.status !== "NOT_YET_RELEASED" && (
                    <Link href={`/watch/${detailedMedia.id}?episode=${nextEpisode}`} className={"block"}>
                        <Button className={"w-full"} intent={"white-outline"} size={"lg"} leftIcon={<AiFillPlayCircle/>}
                                iconClassName={"text-xl"}>Stream online</Button>
                    </Link>
                )}

                <NextAiringEpisode detailedMedia={detailedMedia}/>

            </div>

            <Accordion
                triggerClassName={"bg-gray-900 bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80 hover:bg-gray-800 dark:hover:bg-gray-800 hover:bg-opacity-100 dark:hover:bg-opacity-100"}>
                {relations.length > 0 && (
                    <Accordion.Item title={"Relations"} defaultOpen={true}>
                        <div className={"grid grid-cols-4 gap-4 p-4"}>
                            {relations.slice(0, 4).map(edge => {
                                return <div key={edge.node?.id} className={"col-span-1"}>
                                    <Link href={`/view/${edge.node?.id}`}>
                                        {edge.node?.coverImage?.large && <div
                                            className="h-64 w-full flex-none rounded-md object-cover object-center relative overflow-hidden group/anime-list-item">
                                            <Image
                                                src={edge.node?.coverImage.large}
                                                alt={""}
                                                fill
                                                quality={80}
                                                priority
                                                sizes="10rem"
                                                className="object-cover object-center group-hover/anime-list-item:scale-110 transition"
                                            />
                                            <div
                                                className={"z-[5] absolute bottom-0 w-full h-[60%] bg-gradient-to-t from-black to-transparent"}
                                            />
                                            <Badge
                                                className={"absolute left-2 top-2 font-semibold rounded-md text-[.95rem]"}
                                                intent={"white-solid"}>{edge.node?.format === "MOVIE" ? "Movie" : _.capitalize(edge.relationType || "").replace("_", " ")}</Badge>
                                            <div className={"p-2 z-[5] absolute bottom-0 w-full "}>
                                                <p className={"font-semibold line-clamp-2 overflow-hidden"}>{edge.node?.title?.userPreferred}</p>
                                            </div>
                                        </div>}
                                    </Link>
                                </div>
                            })}
                        </div>
                    </Accordion.Item>
                )}
                <Accordion.Item title={"Recommendations"}>
                    <div className={"grid grid-cols-4 gap-4 p-4"}>
                        {detailedMedia.recommendations?.edges?.map(edge => edge?.node?.mediaRecommendation).filter(Boolean).map(media => {
                            return <div key={media.id} className={"col-span-1"}>
                                <Link href={`/view/${media.id}`}>
                                    {media.coverImage?.large && <div
                                        className="h-64 w-full flex-none rounded-md object-cover object-center relative overflow-hidden group/anime-list-item">
                                        <Image
                                            src={media.coverImage.large}
                                            alt={""}
                                            fill
                                            quality={80}
                                            priority
                                            sizes="10rem"
                                            className="object-cover object-center group-hover/anime-list-item:scale-110 transition"
                                        />
                                        <div
                                            className={"z-[5] absolute bottom-0 w-full h-[60%] bg-gradient-to-t from-black to-transparent"}
                                        />
                                        <div className={"p-2 z-[5] absolute bottom-0 w-full "}>
                                            <p className={"font-semibold line-clamp-2 overflow-hidden"}>{media.title?.userPreferred}</p>
                                        </div>
                                    </div>}
                                </Link>
                            </div>
                        })}
                    </div>
                </Accordion.Item>
            </Accordion>

        </div>
    )

}
