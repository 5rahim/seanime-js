import { anilistCollectionAtom } from "@/atoms/anilist-collection"
import { useSelectAtom } from "@/atoms/helpers"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"

export const useNormalizedEpisodeNumber = (parsedInfo: any, media: AnilistDetailedMedia) => {
    const prequelEpisodes = useSelectAtom(anilistCollectionAtom, n => n?.lists?.flatMap(list => list?.entries).filter(Boolean)
        .find(entry => entry?.media?.id === media.id)?.media?.relations?.edges?.find(n => n?.relationType === "PREQUEL")?.node?.episodes)

    // If there's a prequel AND the episode number from this season is greater the prequel's number of episodes, normalize it
    // Example: JJK S1 is 24 episodes, if S2 episode number is 25 but there's only 23 episodes in S2, then normalize it to 1
    return parsedInfo && parsedInfo.episode && prequelEpisodes
    && media.episodes
    && (Number(parsedInfo?.episode) > prequelEpisodes)
    && (Number(parsedInfo?.episode) > media.episodes)
        ? (Number(parsedInfo?.episode) - (+prequelEpisodes))
        : undefined
}
