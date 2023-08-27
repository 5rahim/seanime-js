import { PrimitiveAtom } from "jotai"
import { useSelectAtom } from "@/atoms/helpers"
import React from "react"
import { AnilistCollectionEntry } from "@/atoms/anilist/entries.atoms"

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
