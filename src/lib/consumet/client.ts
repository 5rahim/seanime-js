import { Nullish } from "@/types/common"
import { useQuery } from "@tanstack/react-query"
import { ConsumetProvider } from "@/lib/consumet/types"
import { getConsumetMediaEpisodes } from "@/lib/consumet/actions"

export const useConsumetMediaEpisodes = (mediaId: Nullish<number>, provider: ConsumetProvider = "gogoanime") => {
    const res = useQuery(["episode-data", mediaId || 0], async () => {
        return await getConsumetMediaEpisodes(mediaId!, provider)
    }, {
        enabled: !!mediaId,
        refetchOnWindowFocus: false,
        retry: 2,
        keepPreviousData: false,
    })
    return res.data || null
}
