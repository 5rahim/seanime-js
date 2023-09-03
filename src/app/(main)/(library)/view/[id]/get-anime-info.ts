"use server"
import { cache } from "react"
import { redirect } from "next/navigation"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeByIdDocument } from "@/gql/graphql"
import { logger } from "@/lib/helpers/debug"
import axios from "axios"

export const getAnimeInfo = cache(async (params: { id: string }) => {
    if (!params.id || isNaN(Number(params.id))) redirect("/")

    const mediaQuery = await useAniListAsyncQuery(AnimeByIdDocument, { id: Number(params.id) })
    if (!mediaQuery.Media) redirect("/")

    const { data: aniZipData } = await axios.get<AniZipData>("https://api.ani.zip/mappings?anilist_id=" + Number(params.id))

    logger("view/id").info("Fetched media data for " + mediaQuery.Media.title?.english)

    return {
        media: mediaQuery.Media,
        aniZipData: aniZipData,
    }
})
