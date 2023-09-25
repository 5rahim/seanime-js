"use server"
import { Settings } from "@/atoms/settings"
import { Nullish } from "@/types/common"
import { ScanLogging } from "@/lib/local-library/logs"
import { logger } from "@/lib/helpers/debug"
import _fs from "fs"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeCollectionDocument, UpdateEntryDocument } from "@/gql/graphql"
import { LocalFile, LocalFileWithMedia } from "@/lib/local-library/types"
import { AnilistShortMedia } from "@/lib/anilist/fragment"
import { inspectProspectiveLibraryEntry } from "@/lib/local-library/library-entry"
import { getMediaTitlesFromLocalDirectory, retrieveHydratedLocalFiles } from "@/lib/local-library/repository"
import { getFulfilledValues, PromiseAllSettledBatch, PromiseAllSettledBatchWithDelay } from "@/lib/helpers/batch"
import { advancedSearchWithMAL } from "@/lib/mal/actions"
import axios from "axios"
import gql from "graphql-tag"
import { experimental_fetchMediaTree } from "@/lib/anilist/actions"
import uniqBy from "lodash/uniqBy"
import omit from "lodash/omit"
import groupBy from "lodash/groupBy"
import chunk from "lodash/chunk"

/**
 * Goes through non-locked and non-ignored [LocalFile]s and returns hydrated [LocalFile]s
 */
export async function scanLocalFiles(props: {
    settings: Settings
    userName: Nullish<string>
    token: string
    markedPaths: {
        ignored: string[]
        locked: string[]
    }
}) {

    const {
        settings,
        userName,
        token,
        markedPaths,
    } = props

    const start = performance.now()
    const _scanLogging = new ScanLogging()
    _scanLogging.add("repository/scanLocalFiles", `Local directory: ${settings.library.localDirectory}`)
    logger("repository/scanLocalFiles").info("Local directory", settings.library.localDirectory)

    // Check if the library exists
    if (!settings.library.localDirectory || !_fs.existsSync(settings.library.localDirectory)) {
        logger("repository/scanLocalFiles").error("Directory does not exist")
        _scanLogging.add("repository/scanLocalFiles", "Directory does not exist")
        await _scanLogging.writeSnapshot()
        _scanLogging.clear()
        return { error: "Couldn't find the local directory." }
    }

    // Get the user watch list data
    _scanLogging.add("repository/scanLocalFiles", "Fetching user media list")
    const data = await useAniListAsyncQuery(AnimeCollectionDocument, { userName })
    const watchListMediaIds = new Set(data.MediaListCollection?.lists?.filter(n => n?.entries).flatMap(n => n?.entries?.map(n => n?.media)).map(n => n?.id).filter(Boolean))

    // Get the hydrated files
    _scanLogging.add("repository/scanLocalFiles", "Retrieving and hydrating local files")
    const files = await retrieveHydratedLocalFiles({ settings, userName, data, markedPaths, _scanLogging })

    _scanLogging.add("repository/scanLocalFiles", `Retrieved ${files?.length || 0} files`)

    if (files && files.length > 0) {

        // Constants
        const filesWithNoMedia: LocalFileWithMedia[] = files.filter(n => !n.media) // Unsuccessfully matched
        const localFilesWithMedia = files.filter(n => !!n.media) // Successfully matched files
        const matchedMedia = uniqBy(files.map(n => n.media), n => n?.id) // Media with file matches

        /** Values to be returned **/
        let checkedFiles: LocalFile[] = [...filesWithNoMedia.map(f => omit(f, "media"))]

        // Keep track of queried media to avoid repeat
        const _queriedMediaCache = new Map<number, AnilistShortMedia>()

        // We group all the hydrated files we got by their media, so we can check them by group (entry)
        const _groupedByMediaId = groupBy(localFilesWithMedia, n => n.media!.id)
        _scanLogging.add("repository/scanLocalFiles", "Inspecting prospective library entry")
        for (let i = 0; i < Object.keys(_groupedByMediaId).length; i++) {
            const mediaId = Object.keys(_groupedByMediaId)[i]
            const mediaIdAsNumber = Number(mediaId)

            if (!isNaN(mediaIdAsNumber)) {
                const currentMedia = matchedMedia.find(media => media?.id === mediaIdAsNumber)
                const filesToBeInspected = localFilesWithMedia.filter(f => f.media?.id === mediaIdAsNumber)

                if (currentMedia) {
                    // Inspect the files grouped under same media
                    const { acceptedFiles, rejectedFiles } = await inspectProspectiveLibraryEntry({
                        media: currentMedia,
                        files: filesToBeInspected,
                        _mediaCache: _queriedMediaCache,
                        _scanLogging,
                    })

                    checkedFiles = [
                        ...checkedFiles,
                        // Set media id for accepted files
                        ...acceptedFiles.map(f => omit(f, "media")).map(file => ({
                            ...file,
                            mediaId: file.mediaId || currentMedia.id,
                        })),
                        ...rejectedFiles.map(f => omit(f, "media")),
                    ]
                }

            }
        }

        _queriedMediaCache.clear()

        const unknownButAddedMediaIds = new Set() // Keep track to avoid repeat
        // Go through checked files -> If we find a mediaId that isn't in the user watch list, add that media to PLANNING list
        for (let i = 0; i < checkedFiles.length; i++) {
            const file = checkedFiles[i]
            if (file.mediaId && !unknownButAddedMediaIds.has(file.mediaId) && !watchListMediaIds.has(file.mediaId)) {
                try {
                    const mutation = await useAniListAsyncQuery(UpdateEntryDocument, {
                        mediaId: file.mediaId, // Int
                        status: "PLANNING", // MediaListStatus
                    }, token)
                    _scanLogging.add(file.path, "Added media to PLANNING list")
                } catch (e) {
                    _scanLogging.add(file.path, "error - Could not add media to PLANNING list")
                }
                unknownButAddedMediaIds.add(file.mediaId)
            }
        }

        const end = performance.now()

        _scanLogging.add("repository/scanLocalFiles", "Finished")
        _scanLogging.add("repository/scanLocalFiles", `The scan was completed in ${((end - start) / 1000).toFixed(2)} seconds`)
        logger("repository/scanLocalFiles").success("Library scanned successfully", checkedFiles.length)

        await _scanLogging.writeSnapshot()
        _scanLogging.clear()

        return {
            /**
             * Non-locked and non-ignored scanned files with up-to-date meta (mediaIds)
             */
            checkedFiles,
        }
    }

    logger("repository/scanLocalFiles").success("Library scanned successfully 0")
    await _scanLogging.writeSnapshot()
    _scanLogging.clear()

    return { checkedFiles: [] }
}

/* -------------------------------------------------------------------------------------------------
 * Blind scan
 * -----------------------------------------------------------------------------------------------*/

export async function experimental_blindScanLocalFiles(props: {
    settings: Settings,
}) {

    const { settings } = props

    const _scanLogging = new ScanLogging()
    const _aniZipCache = new Map<number, AniZipData>()
    const _mediaCache = new Map<number, AnilistShortMedia>

    // Check if the library exists
    if (!settings.library.localDirectory || !_fs.existsSync(settings.library.localDirectory)) {
        logger("repository/experimental_blindScanLocalFiles").error("Directory does not exist")
        _scanLogging.add("repository/experimental_blindScanLocalFiles", "Directory does not exist")
        await _scanLogging.writeSnapshot()
        _scanLogging.clear()
        return { error: "Couldn't find the local directory." }
    }

    // Get the user watch list data
    _scanLogging.add("repository/experimental_blindScanLocalFiles", "Fetching media from local directory")

    const prospectiveMediaTitles = await getMediaTitlesFromLocalDirectory({ directoryPath: settings.library.localDirectory })

    if (!prospectiveMediaTitles) {
        return { error: "Couldn't find any media in the local directory." }
    }

    const malBatchResults = await PromiseAllSettledBatch(advancedSearchWithMAL, prospectiveMediaTitles.items.map(item => item.title), 50)
    const malResults = (await getFulfilledValues(malBatchResults)).filter(Boolean)

    async function aniZipSearch(malId: number) {
        const { data } = await axios.get<AniZipData>(`https://api.ani.zip/mappings?mal_id=${malId}`)
        if (data.mappings.anilist_id) _aniZipCache.set(data.mappings.anilist_id, data) // Populate cache
        return data
    }

    const aniZipBatchResults = await PromiseAllSettledBatch(aniZipSearch, malResults.map(n => n.id), 50)
    const aniZipResults = (await getFulfilledValues(aniZipBatchResults)).filter(Boolean)
    const anilistIds = aniZipResults.filter(Boolean).map(n => n.mappings.anilist_id).filter(Boolean)

    const anilistIdChunks = chunk(anilistIds, 10)

    async function runAnilistQuery(ids: number[]) {
        return await useAniListAsyncQuery<{ [key: string]: AnilistShortMedia } | null, any>(gql`
            query AnimeByMalId {
                ${ids.map(id => `
            t${id}: Media(id: ${id}, type: ANIME) {
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
            }
            `)}
            }
        `, undefined)
    }

    // Query AniList, 5 batches of 10 each 2.5s
    const anilistBatchResults = await PromiseAllSettledBatchWithDelay(runAnilistQuery, anilistIdChunks, 5, 2500)
    const anilistResults = (await getFulfilledValues(anilistBatchResults)).filter(Boolean)

    const media = Object.values(anilistResults).flatMap(n => Object.values(n)).filter(Boolean)

    for (const medium of media) {
        // Populate cache
        _mediaCache.set(medium.id, medium)
    }

    async function fetchTreeMaps(media: AnilistShortMedia) {
        const treeMap = new Map<number, AnilistShortMedia>()
        const start = performance.now()
        logger("scan/experimental_analyzeMediaTree").warning("Fetching media tree in for " + media.title?.english)
        await experimental_fetchMediaTree({ media, treeMap, _mediaCache: _mediaCache })
        const end = performance.now()
        logger("scan/experimental_analyzeMediaTree").info("Fetched media tree in " + (end - start) + "ms")
        return [...treeMap.values()]
    }

    const relationsBatchResults = await PromiseAllSettledBatchWithDelay(fetchTreeMaps, media, 1, 1500)
    const relationsResults = (await getFulfilledValues(relationsBatchResults)).flat()


    // // Check which titles have a season parse, if they do, fetch the entire tree
    // const itemsWithSeason = prospectiveMediaTitles.items.filter(item => !!item.parsed.season && Number.isInteger(item.parsed.season) && Number(item.parsed.season) > 1)
    // const mediaWeNeedToFetchTreeOf = itemsWithSeason.map(item => {
    //     const comparisons = media.map(medium => {
    //         return {
    //             medium,
    //             comparison: compareTitleVariationsToMediaTitles(medium, [item.title])
    //         }
    //     })
    //     return {
    //         item,
    //         media: comparisons.reduce((prev, curr) => prev.comparison.distance < curr.comparison.distance ? prev : curr).medium
    //     }
    // })

    return [...media, ...relationsResults]


}
