import { PrimitiveAtom } from "jotai"
import { useSelectAtom } from "@/atoms/helpers"
import React from "react"
import { AnilistCollectionEntry } from "@/atoms/anilist/entries.atoms"
import { Badge } from "@/components/ui/badge"
import { BiStar } from "@react-icons/all-files/bi/BiStar"

export function ScoreProgressBadges({ collectionEntryAtom, episodes }: {
    collectionEntryAtom: PrimitiveAtom<AnilistCollectionEntry>,
    episodes: number | null | undefined
}) {

    const score = useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.score)
    const progress = useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress)

    const scoreColor = score ? (
        score < 5 ? "bg-red-500" :
            score < 7 ? "bg-orange-500" :
                score < 9 ? "bg-green-500" :
                    "bg-brand-500 text-white"
    ) : ""

    if (!progress) return null

    return (
        <>
            {!!score && <Badge leftIcon={<BiStar/>} size={"xl"} intent={"primary-solid"} className={scoreColor}>
                {score}
            </Badge>}
            <Badge
                size={"xl"}
                className={"!text-lg font-bold !text-yellow-50"}
            >
                {`${progress}/${episodes || "-"}`}
            </Badge>
        </>
    )
}
