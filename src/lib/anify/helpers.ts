import { useQuery } from "@tanstack/react-query"
import { getAnifyAnimeMetadata } from "@/lib/anify/actions"

export function useAnifyAnimeMetadata(mediaId: number) {
    const { data } = useQuery({
        queryKey: ["anify-episode-covers", mediaId],
        queryFn: async () => {
            const res = await getAnifyAnimeMetadata(mediaId)
            if (!!res && Array.isArray(res))
                return res
            return []
        },
        keepPreviousData: true,
        cacheTime: 1000 * 60 * 10,
    })

    return { anifyEpisodeData: data }
}
