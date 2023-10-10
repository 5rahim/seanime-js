// FIXME
export function useAnifyAnimeMetadata(mediaId: number) {
    // const { data } = useQuery({
    //     queryKey: ["anify-episode-covers", mediaId],
    //     queryFn: async () => {
    //         const res = await getAnifyAnimeMetadata(mediaId)
    //         if (!!res && Array.isArray(res))
    //             return res
    //         console.log(res)
    //         return []
    //     },
    //     keepPreviousData: false,
    //     cacheTime: 0,
    // })

    return { anifyEpisodeData: [] }
}
