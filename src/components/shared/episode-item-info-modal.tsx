"use client"
import React, { Fragment } from "react"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { Modal } from "@/components/ui/modal"
import Image from "next/image"
import { AniZipData } from "@/lib/anizip/types"
import { Atom } from "jotai"
import { LocalFile } from "@/lib/local-library/types"
import { anizip_getEpisodeFromMetadata } from "@/lib/anizip/utils"
import { useStableSelectAtom } from "@/atoms/helpers"
import { Divider } from "@/components/ui/divider"

export type EpisodeItemInfoModalProps = {
    media: AnilistShowcaseMedia,
    aniZipData?: AniZipData,
    fileAtom: Atom<LocalFile>,
    isOpen: boolean,
    onClose: () => void,
    title: string,
}


export function EpisodeItemInfoModal(props: EpisodeItemInfoModalProps) {

    const {
        title,
        media,
        aniZipData,
        isOpen,
        onClose,
    } = props

    const metadata = useStableSelectAtom(props.fileAtom, file => file.metadata)
    const aniZipEpisode = anizip_getEpisodeFromMetadata(aniZipData, { metadata })

    console.log(aniZipEpisode)

    if (!aniZipEpisode) return null

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={title}
                isClosable
                size={"xl"}
                titleClassName={"text-xl "}
            >

                {media.coverImage?.extraLarge && <div
                    className="h-[8rem] w-full flex-none object-cover object-center overflow-hidden absolute left-0 top-0 z-[-1]">
                    <Image
                        src={aniZipEpisode.image || media.bannerImage || media.coverImage.extraLarge}
                        alt={"banner"}
                        fill
                        quality={80}
                        priority
                        sizes="20rem"
                        className="object-cover object-center opacity-30"
                    />
                    <div
                        className={"z-[5] absolute bottom-0 w-full h-[80%] bg-gradient-to-t from-gray-900 to-transparent"}
                    />
                </div>}

                <div className="space-y-4">
                    <p className="text-lg line-clamp-2 font-semibold">
                        {aniZipEpisode.title?.en?.replace("`", "'") ?? "No title"}
                    </p>
                    <p className="text-[--muted]">
                        {aniZipEpisode.airdate ? new Date(aniZipEpisode.airdate).toLocaleDateString() : "No airing date"} {aniZipEpisode.length ? `- ${aniZipEpisode.runtime || aniZipEpisode.length} minutes` : ""}
                    </p>
                    <p className="text-[--muted]">
                        {aniZipEpisode.summary?.replaceAll("`", "'").replace(/Source:?\s?\w+/gi, "") ?? aniZipEpisode.overview ?? "No summary"}
                    </p>
                    <Divider/>
                    <div className="w-full flex justify-between">
                        <p>AniDB Episode: {metadata?.aniDBEpisodeNumber}</p>
                        <a href={"https://anidb.net/anime/" + aniZipData?.mappings.anidb_id + "#layout-footer"}
                           target={"_blank"}
                           className={"text-brand-200"}>Open on AniDB</a>
                    </div>
                </div>

            </Modal>
        </>
    )

}
