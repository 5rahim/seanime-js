import { useQuery } from "@tanstack/react-query"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeByIdDocument } from "@/gql/graphql"
import axios from "axios"
import { AniZipData } from "@/lib/anizip/types"

export function useGetTorrentSearchAnimeInfo(mediaId: number) {

    const res = useQuery([
        "torrent-search-anime-info",
        mediaId,
    ], async () => {
        const [animeRes, aniZipRes] = await Promise.all([
            useAniListAsyncQuery(AnimeByIdDocument, { id: Number(mediaId) }),
            axios.get<AniZipData>("https://api.ani.zip/mappings?anilist_id=" + Number(mediaId)),
        ])

        return {
            media: animeRes.Media ?? null,
            aniZipData: aniZipRes.data ?? null,
        }
    }, { refetchOnWindowFocus: false, keepPreviousData: false })

    return { ...res.data, isLoading: res.isLoading }

}
