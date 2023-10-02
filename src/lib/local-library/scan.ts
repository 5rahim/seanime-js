"use server"
import { Settings } from "@/atoms/settings"
import { Nullish } from "@/types/common"
import { _dumpToFile, ScanLogging } from "@/lib/local-library/logs"
import { logger } from "@/lib/helpers/debug"
import _fs from "fs"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeCollectionDocument, UpdateEntryDocument } from "@/gql/graphql"
import { LocalFile, LocalFileWithMedia } from "@/lib/local-library/types"
import { AnilistShortMedia } from "@/lib/anilist/fragment"
import { inspectProspectiveLibraryEntry } from "@/lib/local-library/library-entry"
import { retrieveLocalFilesWithMedia } from "@/lib/local-library/repository"
import uniqBy from "lodash/uniqBy"
import omit from "lodash/omit"
import groupBy from "lodash/groupBy"
import Bottleneck from "bottleneck"
import { ANILIST_BOTTLENECK_OPTIONS } from "@/lib/anilist/config"

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
    enhanced?: "full" | "partial" | "none"
}) {

    const {
        settings,
        userName,
        token,
        markedPaths,
        enhanced = "none",
    } = props

    const anilistLimiter = new Bottleneck(ANILIST_BOTTLENECK_OPTIONS)

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

    // Get the user anime list data
    _scanLogging.add("repository/scanLocalFiles", "Fetching user media list")
    const anilistCollection = await useAniListAsyncQuery(AnimeCollectionDocument, { userName })
    const watchListMediaIds = new Set(anilistCollection.MediaListCollection?.lists?.filter(n => n?.entries).flatMap(n => n?.entries?.map(n => n?.media)).map(n => n?.id).filter(Boolean))


    // Get the hydrated files
    // Keep track of queried media to avoid repeat
    const _mediaCache = new Map<number, AnilistShortMedia>()
    const _aniZipCache = new Map<number, AniZipData>
    _scanLogging.add("repository/scanLocalFiles", "Retrieving and hydrating local files")
    const localFilesWithMediaOrNull = await retrieveLocalFilesWithMedia({
        settings,
        userName,
        anilistCollection,
        markedPaths,
        _scanLogging,
        _mediaCache,
        _aniZipCache,
        enhanced,
    }, anilistLimiter)

    // await _dumpToFile("scanned-files-with-media", localFilesWithMediaOrNull) /* DUMP */

    _scanLogging.add("repository/scanLocalFiles", `Retrieved ${localFilesWithMediaOrNull?.length || 0} files`)

    if (!(localFilesWithMediaOrNull && localFilesWithMediaOrNull.length > 0)) {
        logger("repository/scanLocalFiles").success("Library scanned successfully 0")
        await _scanLogging.writeSnapshot()
        _scanLogging.clear()
        _mediaCache.clear()
        _aniZipCache.clear()

        return { scannedFiles: [] }
    }

    /**/

    // Constants
    const filesWithNoMedia: LocalFileWithMedia[] = localFilesWithMediaOrNull.filter(n => !n.media) // Unsuccessfully matched
    const localFilesWithMedia = localFilesWithMediaOrNull.filter(n => !!n.media) // Successfully matched files
    const matchedMedia = uniqBy(localFilesWithMediaOrNull.map(n => n.media), n => n?.id) // Media with file matches

    /** Values to be returned **/
    let scannedFiles: LocalFile[] = [...filesWithNoMedia.map(f => omit(f, "media"))]


    // We group all the hydrated files we got by their media, so we can check them by group (entry)
    const _groupedByMediaId = groupBy(localFilesWithMedia, n => n.media!.id)

    // _scanLogging.add("repository/scanLocalFiles", "Fetching AniZip data")
    // await PromiseAllSettledBatchWithDelay(getAniZipData, Object.keys(_groupedByMediaId).map(n => Number(n)), 20, 600)

    _scanLogging.add("repository/scanLocalFiles", "Inspecting prospective library entry")
    for (let i = 0; i < Object.keys(_groupedByMediaId).length; i++) {
        const mediaId = Object.keys(_groupedByMediaId)[i]
        const mediaIdAsNumber = Number(mediaId)

        if (!isNaN(mediaIdAsNumber)) {
            const currentMedia = matchedMedia.find(media => media?.id === mediaIdAsNumber)
            const filesToBeInspected = localFilesWithMedia.filter(f => f.media?.id === mediaIdAsNumber)

            // TODO Check if filesToBeInspected has duplicated episode numbers, this would indicate mis-match and missing season

            if (currentMedia) {
                // Inspect the files grouped under same media
                const { acceptedFiles, rejectedFiles } = await inspectProspectiveLibraryEntry({
                    media: currentMedia,
                    files: filesToBeInspected,
                    _mediaCache: _mediaCache,
                    _aniZipCache: _aniZipCache,
                    _scanLogging,
                }, anilistLimiter)

                scannedFiles = [
                    ...scannedFiles,
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

    _mediaCache.clear()
    _aniZipCache.clear()

    const unknownButAddedMediaIds = new Set() // Keep track to avoid repeat
    // Go through checked files -> If we find a mediaId that isn't in the user anime list, add that media to PLANNING list
    for (let i = 0; i < scannedFiles.length; i++) {
        const file = scannedFiles[i]
        if (file.mediaId && !unknownButAddedMediaIds.has(file.mediaId) && !watchListMediaIds.has(file.mediaId)) {
            try {
                const mutation = await anilistLimiter.schedule(() => useAniListAsyncQuery(UpdateEntryDocument, {
                    mediaId: file.mediaId, // Int
                    status: "PLANNING", // MediaListStatus
                }, token))
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
    logger("repository/scanLocalFiles").success("Library scanned successfully", scannedFiles.length)

    await _scanLogging.writeSnapshot()
    _scanLogging.clear()

    await _dumpToFile("scanned-files", scannedFiles)

    return {
        /**
         * Non-locked and non-ignored scanned files with up-to-date meta (mediaIds)
         */
        scannedFiles,
    }

}
