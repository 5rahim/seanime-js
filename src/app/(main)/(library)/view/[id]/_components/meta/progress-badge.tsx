import { PrimitiveAtom } from "jotai/index"
import { AnilistCollectionEntry } from "@/atoms/anilist-collection"
import { useSelectAtom } from "@/atoms/helpers"
import React from "react"

export function ProgressBadge({ collectionEntryAtom, episodes }: {
    collectionEntryAtom: PrimitiveAtom<AnilistCollectionEntry>,
    episodes: number | null | undefined
}) {

    const progress = useSelectAtom(collectionEntryAtom, collectionEntry => collectionEntry?.progress)

    if (!progress) return null

    return (
        <>
            <div
                className={"text-3xl font-bold text-yellow-100"}
            >
                {`${progress}/${episodes || "-"}`}
            </div>
        </>
    )
}
