import { AnilistShortMedia } from "@/lib/anilist/fragment"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeShortMediaByIdDocument } from "@/gql/graphql"

export async function fetchAnilistShortMedia(mediaId: number, _cache?: Map<number, AnilistShortMedia>) {
    if (_cache?.has(mediaId)) {
        return _cache.get(mediaId)
    }

    const data = (await useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: mediaId })).Media

    if (data) {
        _cache?.set(mediaId, data)
    }
    return data
}
