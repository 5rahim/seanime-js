import { Settings } from "@/atoms/settings"
import { ScanLogging } from "@/lib/local-library/logs"
import { AnilistShortMedia } from "@/lib/anilist/fragment"
import _fs from "fs"
import { logger } from "@/lib/helpers/debug"
import { getMediaTitlesFromLocalDirectory } from "@/lib/local-library/repository"
import { getFulfilledValues, PromiseAllSettledBatch } from "@/lib/helpers/batch"
import { advancedSearchWithMAL } from "@/lib/mal/actions"
import { fetchAniZipData } from "@/lib/anizip/helpers"
import chunk from "lodash/chunk"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import gql from "graphql-tag"
import Bottleneck from "bottleneck"
import uniqBy from "lodash/uniqBy"
import { experimental_fetchMediaTree } from "@/lib/anilist/actions"
import { ANILIST_BOTTLENECK_OPTIONS } from "@/lib/anilist/config"

export async function experimental_blindScanLibraryMedia(props: {
    settings: Settings,
    _scanLogging: ScanLogging
    _aniZipCache: Map<number, AniZipData>
    _mediaCache: Map<number, AnilistShortMedia>
}, limiter?: Bottleneck) {

    const {
        settings,
        _aniZipCache,
        _scanLogging,
        _mediaCache,
    } = props

    let requestCount = 0

    const anilistLimiter = limiter ?? new Bottleneck(ANILIST_BOTTLENECK_OPTIONS)

    // Check if the library exists
    if (!settings.library.localDirectory || !_fs.existsSync(settings.library.localDirectory)) {
        logger("local-library/experimental_blindScanLocalFiles").error("Directory does not exist")
        _scanLogging.add("local-library/experimental_blindScanLocalFiles", "Directory does not exist")
        await _scanLogging.writeSnapshot()
        _scanLogging.clear()
        return { error: "Couldn't find the local directory." }
    }

    // Get the user watch list data
    _scanLogging.add("local-library/experimental_blindScanLocalFiles", "Fetching media from local directory")

    const prospectiveMediaTitles = await getMediaTitlesFromLocalDirectory({ directoryPath: settings.library.localDirectory })

    if (!prospectiveMediaTitles) {
        return { error: "Couldn't find any media in the local directory." }
    }

    const malBatchResults = await PromiseAllSettledBatch(advancedSearchWithMAL, prospectiveMediaTitles.items.map(item => item.title), 50)
    const malResults = (await getFulfilledValues(malBatchResults)).filter(Boolean)

    async function aniZipSearch(malId: number) {
        return await fetchAniZipData(malId, _aniZipCache, "mal")
    }

    const aniZipBatchResults = await PromiseAllSettledBatch(aniZipSearch, malResults.map(n => n.id), 50)
    const aniZipResults = (await getFulfilledValues(aniZipBatchResults)).filter(Boolean)
    const anilistIds = aniZipResults.filter(Boolean).map(n => n.mappings.anilist_id).filter(Boolean)

    const anilistIdChunks = chunk(anilistIds, 10)

    async function runAnilistQuery(ids: number[]) {
        requestCount++
        return await anilistLimiter.schedule(() => useAniListAsyncQuery<{
            [key: string]: AnilistShortMedia
        } | null, any>(gql`
            query AnimeByMalId {
                ${ids.map(id => `
            t${id}: Media(id: ${id}, type: ANIME) {
                id
                idMal
                status(version: 2)
                season
                type
                format
                episodes
                title {
                    userPreferred
                    romaji
                    english
                    native
                }
                synonyms
                relations {
                    edges {
                        relationType(version: 2)
                        node {
                            id
                            idMal
                            status(version: 2)
                            season
                            type
                            format
                            title {
                                userPreferred
                                romaji
                                english
                                native
                            }
                            synonyms
                        }
                    }
                }
                nextAiringEpisode {
                    airingAt
                    timeUntilAiring
                    episode
                }
            }
            `)}
            }
        `, undefined))
    }

    /* Fetching media with relations */

    const s2s = performance.now()
    logger("local-library/experimental_blindScanLocalFiles").warning("Fetching media with relations")
    const result = await Promise.allSettled(anilistIdChunks.map(chunk => runAnilistQuery(chunk)))
    const s2e = performance.now()
    logger("local-library/experimental_blindScanLocalFiles").info("Finished fetching media with relations in ", (s2e - s2s), "ms")

    const anilistResults = (await getFulfilledValues(result)).filter(Boolean)

    const fetchedMedia = Object.values(anilistResults).flatMap(n => Object.values(n)).filter(Boolean)

    for (const media of fetchedMedia) {
        // Populate cache
        _mediaCache.set(media.id, media)
    }

    if (requestCount > 9) { // 9 chunked requests * 10 chunks = at least 90 media ~= 90 tree requests
        await new Promise(resolve => setTimeout(resolve, 1000 * 60))
    }

    /* Fetching tree maps */
    const treeMap = new Map<number, AnilistShortMedia>()

    async function fetchTreeMaps(media: AnilistShortMedia) {
        const start = performance.now()
        logger("local-library/experimental_blindScanLocalFiles").warning("Fetching media tree in for " + media.title?.english)
        await experimental_fetchMediaTree({
            media,
            treeMap,
            _mediaCache: _mediaCache,
            excludeStatus: ["NOT_YET_RELEASED"],
        }, anilistLimiter)
        const end = performance.now()
        logger("local-library/experimental_blindScanLocalFiles").info("Fetched media tree in for " + media?.title?.english + " in " + (end - start) + "ms")
        return true
    }

    const s3s = performance.now()
    logger("local-library/experimental_blindScanLocalFiles").warning("Fetching all media trees")

    await Promise.allSettled(fetchedMedia.map(media => fetchTreeMaps(media)))

    const s3e = performance.now()
    logger("local-library/experimental_blindScanLocalFiles").info("Fetched all media trees in " + (s3e - s3s) + "ms")
    const relationsResults = [...treeMap.values()]

    treeMap.clear()

    return uniqBy([...fetchedMedia, ...relationsResults], n => n.id)


}
