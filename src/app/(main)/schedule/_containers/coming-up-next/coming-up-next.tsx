import { useAtomValue } from "jotai/react"
import { Slider } from "@/components/shared/slider"
import React from "react"
import { allUserMediaAtom } from "@/atoms/anilist/media.atoms"
import { addSeconds, formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { AppLayoutStack } from "@/components/ui/app-layout"

type Props = {}

export function ComingUpNext(props: Props) {

    const _media = useAtomValue(allUserMediaAtom)

    const media = _media.filter(item => !!item.nextAiringEpisode?.episode).sort((a, b) => a.nextAiringEpisode!.timeUntilAiring - b.nextAiringEpisode!.timeUntilAiring)

    if (media.length === 0) return null

    return (
        <AppLayoutStack>
            <h2>Coming up next</h2>
            <Slider>
                {media.map(item => {
                    return (
                        <div
                            key={item.id}
                            className={"rounded-md border border-gray-800 overflow-hidden aspect-[4/2] w-96 relative flex items-end flex-none group/missed-episode-item"}
                        >
                            <div
                                className={"absolute w-full h-full rounded-md rounded-b-none overflow-hidden z-[1]"}>
                                {!!item.bannerImage ? <Image
                                    src={item.bannerImage}
                                    alt={""}
                                    fill
                                    quality={100}
                                    sizes="20rem"
                                    className="object-cover object-center transition opacity-20"
                                /> : <div
                                    className={"h-full block absolute w-full bg-gradient-to-t from-gray-800 to-transparent z-[2]"}></div>}
                                <div
                                    className={"z-[1] absolute bottom-0 w-full h-[80%] bg-gradient-to-t from-[--background-color] to-transparent"}
                                />
                            </div>
                            <div className={"relative z-[3] w-full p-4 space-y-1"}>
                                <p className={"w-[80%] line-clamp-1 text-[--muted] font-semibold"}>{item.title?.userPreferred}</p>
                                <div className={"w-full justify-between flex items-center"}>
                                    <p className={"text-xl font-semibold"}>Episode {item.nextAiringEpisode?.episode}</p>
                                    {item.nextAiringEpisode?.timeUntilAiring &&
                                        <p className={"text-[--muted]"}>{formatDistanceToNow(addSeconds(new Date(), item.nextAiringEpisode?.timeUntilAiring), { addSuffix: true })}</p>}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </Slider>
        </AppLayoutStack>
    )
}
