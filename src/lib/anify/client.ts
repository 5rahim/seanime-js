import { useQuery } from "@tanstack/react-query"
import { getAnifyEpisodeCovers } from "@/lib/anify/actions"

export function useAnifyEpisodeCovers(mediaId: number) {
    const { data } = useQuery({
        queryKey: ["anify-episode-covers", mediaId],
        queryFn: async () => {
            const res = await getAnifyEpisodeCovers(mediaId)
            if (!!res && Array.isArray(res))
                return res
            // logger("lib/anify/useAnifyEpisodeCovers").error(res)
            return []
        },
        keepPreviousData: false,
        suspense: false,
    })

    return { anifyEpisodeCovers: data }
}
