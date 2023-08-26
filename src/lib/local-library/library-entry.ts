"use server"
import { LocalFileWithMedia } from "@/lib/local-library/local-file"
import { AnilistShortMedia, AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import similarity from "string-similarity"
import { logger } from "@/lib/helpers/debug"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import {
    AnimeByMalIdDocument,
    AnimeCollectionDocument,
    AnimeShortMediaByIdDocument,
    UpdateEntryDocument,
} from "@/gql/graphql"
import fs from "fs"
import { ANIDB_RX } from "@/lib/series-scanner/regex"
import { findMediaEdge } from "@/lib/anilist/helpers.shared"
import { resolveSeason } from "@/lib/anilist/helpers.server"
import { getLocalFileParsedEpisode, getLocalFileParsedSeason } from "@/lib/local-library/helpers.shared"
import { ScanLogging } from "@/lib/local-library/logs"
import { isSeasonTitle } from "@/lib/local-library/media-matching"

export type ProspectiveLibraryEntry = {
    media: AnilistShowcaseMedia
    accuracy: number
    sharedPath: string
    acceptedFiles: LocalFileWithMedia[],
    rejectedFiles: LocalFileWithMedia[]
}

/**
 * This function inspects all the files that were grouped under a same media
 * It rates them and reject files with certain parameters
 */
export const inspectProspectiveLibraryEntry = async (props: {
    media: AnilistShowcaseMedia,
    files: LocalFileWithMedia[],
    _queriedMediaCache: Map<number, AnilistShortMedia>
    _scanLogging: ScanLogging
}): Promise<ProspectiveLibraryEntry> => {

    const { _queriedMediaCache, _scanLogging } = props
    const currentMedia = props.media
    const files = props.files.filter(f => f.media?.id === currentMedia?.id)

    if (files.length && files.length > 0) {
        // Return each file with a rating
        const lFilesWithRating = files.map(f => {
            // Select the file's media titles
            const mediaTitles = [
                currentMedia?.title?.english,
                currentMedia?.title?.romaji,
                currentMedia?.title?.userPreferred,
                ...(currentMedia.synonyms?.filter(isSeasonTitle) || []),
            ].filter(Boolean).map(n => n.toLowerCase())
            // Get the file's parent folder anime title
            const fileFolderTitle = f.parsedFolderInfo.findLast(n => !!n.title)?.title
            // Get the file's anime title
            const fileTitle = f.parsedInfo?.title
            // Get the file's parent folder original name
            const fileFolderOriginal = f.parsedFolderInfo.findLast(n => !!n.title)?.original

            let rating = 0
            let ratingByFolderName = 0

            /** Rate how the file's parameters match with the actual anime title **/
            _scanLogging.add(f.path, ">>> [inspectProspectiveLibraryEntry]")
            _scanLogging.add(f.path, "Rating file's parameters match with the actual anime title")

            // Rate the file's parent folder anime title
            if (fileFolderTitle && mediaTitles.length > 0) {
                const bestMatch = similarity.findBestMatch(fileFolderTitle.toLowerCase(), mediaTitles)
                rating = bestMatch.bestMatch.rating
                _scanLogging.add(f.path, `   -> Rating parent folder parsed anime title (${fileFolderTitle}) ` + rating)
            }
            // Rate the file's anime title
            if (fileTitle && mediaTitles.length > 0) {
                const bestMatch = similarity.findBestMatch(fileTitle.toLowerCase(), mediaTitles)
                rating = bestMatch.bestMatch.rating > rating ? bestMatch.bestMatch.rating : rating
                _scanLogging.add(f.path, `   -> Rating file parsed anime title (${fileTitle}) ` + rating)
            }
            // Rate the file's parent folder original name
            if (fileFolderOriginal) {
                const bestMatch = similarity.findBestMatch(fileFolderOriginal.toLowerCase(), mediaTitles)
                ratingByFolderName = bestMatch.bestMatch.rating
                _scanLogging.add(f.path, `   -> Rating parent folder original name (${fileFolderOriginal}) ` + rating)
            }

            _scanLogging.add(f.path, "   -> Final title rating " + rating + " | Final folder original name rating " + ratingByFolderName)

            return {
                file: f,
                rating: rating,
                ratingByFolderName,
            }
        })
        // Find the highest ratings, that will be the base
        const highestRating = Math.max(...lFilesWithRating.map(item => item.rating))
        const highestRatingByFolderName = Math.max(...lFilesWithRating.map(item => item.ratingByFolderName))

        // We will keep these OVAs, NC,... files even if they don't meet all parameters
        // Why? the folder rating might be very low because they are in a folder named "Specials"
        const isNotMain = (file: LocalFileWithMedia) => {
            return (
                ANIDB_RX[0].test(file.path) ||
                ANIDB_RX[1].test(file.path) ||
                ANIDB_RX[2].test(file.path) ||
                ANIDB_RX[4].test(file.path) ||
                ANIDB_RX[5].test(file.path) ||
                ANIDB_RX[6].test(file.path)
            )
        }


        // This is meant to filter out files that differ from the best matches
        // For example this can help avoid having different season episodes under the same Anime
        let mostAccurateFiles = lFilesWithRating
            // Keep files with a rating greater than 0.3 - This might be meaningless
            .filter(item => item.rating >= 0.3 || isNotMain(item.file))
            // If a file has a lower rating than the highest, filter it out
            .filter(item => item.rating.toFixed(3) === highestRating.toFixed(3) || isNotMain(item.file))
            //
            .filter(item =>
                // Keep files with the highest folder rating
                (item.ratingByFolderName.toFixed(3) === highestRatingByFolderName.toFixed(3))
                // OR files with folder rating deviation from the highest that is lower than 0.1
                || Math.abs(+item.ratingByFolderName.toFixed(3) - +highestRatingByFolderName.toFixed(3)) < 0.1 // deviation is lower than 0.1
                // OR files that are specials, ova...
                || isNotMain(item.file),
            )
            .map(item => item.file)

        // Resolve absolute episode
        if (currentMedia.format !== "MOVIE") {
            // Get the highest episode number
            const highestEp = currentMedia?.nextAiringEpisode?.episode || currentMedia?.episodes

            for (let i = 0; i < mostAccurateFiles.length; i++) {
                const file = mostAccurateFiles[i]
                const season = getLocalFileParsedSeason(file.parsedInfo, file.parsedFolderInfo)
                const episode = getLocalFileParsedEpisode(file.parsedInfo)

                _scanLogging.add(file.path, `Checking for absolute episode number`)

                // The parser got an absolute episode number, we will normalize it and give the file the correct ID
                if (!!highestEp && !!episode && episode > highestEp) {

                    logger("library-entry/inspectProspectiveLibraryEntry").warning(currentMedia.title?.userPreferred, `Absolute episode number detected`)
                    _scanLogging.add(file.path, "warning - Absolute episode number detected")

                    // Fetch the same media but with all necessary info (relations prop) to find the relative episode
                    let fetchedMedia: AnilistShortMedia | null | undefined
                    if (!_queriedMediaCache.has(currentMedia.id)) {
                        _scanLogging.add(file.path, "    -> Fetching necessary relations details by querying [AnimeShortMediaByIdDocument] (Cache MISS)")
                        logger("library-entry/inspectProspectiveLibraryEntry").warning(`    -> Fetching necessary details (Cache MISS)`)
                        fetchedMedia = (await useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: currentMedia.id })).Media
                        if (fetchedMedia) _queriedMediaCache.set(currentMedia.id, fetchedMedia)
                    } else {
                        _scanLogging.add(file.path, "    -> Fetching necessary details (Cache HIT)")
                        logger("library-entry/inspectProspectiveLibraryEntry").warning(`    -> Fetching necessary relations details (Cache HIT)`)
                        fetchedMedia = _queriedMediaCache.get(currentMedia.id)
                    }

                    const prequel = !season ? (
                        findMediaEdge(fetchedMedia, "PREQUEL")?.node
                        || ((fetchedMedia?.format === "OVA" || fetchedMedia?.format === "ONA")
                            ? findMediaEdge(fetchedMedia, "PARENT")?.node
                            : undefined)
                    ) : undefined

                    // value bigger than episode count
                    const result = await resolveSeason({
                        media: prequel || fetchedMedia,
                        episode: episode,
                        increment: null,
                        // increment: !season ? null : true,
                        // force: true
                    })
                    _scanLogging.add(file.path, `    -> Normalized episode ${episode} to ${result?.episode}`)
                    logger("library-entry/inspectProspectiveLibraryEntry").warning(`    -> Normalized episode ${episode} to ${result?.episode}`)
                    if (result?.episode && result?.episode > 0) {
                        // Replace episode and mediaId
                        mostAccurateFiles[i].metadata = { ...mostAccurateFiles[i].metadata, episode: result.episode }
                        mostAccurateFiles[i].mediaId = result.rootMedia.id

                        _scanLogging.add(file.path, `    -> Overriding Media ID ${currentMedia.id} to ${result.rootMedia.id}`)
                    } else {
                        _scanLogging.add(file.path, `    -> error - Could not normalize the episode number`)
                    }
                } else {
                    mostAccurateFiles[i].metadata = { ...mostAccurateFiles[i].metadata, episode: episode }
                    _scanLogging.add(file.path, `   -> Did not detect absolute episode number`)
                }

            }

        }

        const rejectedFiles = files.filter(n => !mostAccurateFiles.find(f => f.path === n.path))

        const firstFile = mostAccurateFiles?.[0]

        rejectedFiles.map(f => {
            _scanLogging.add(f.path, `warning - File was rejected because it was below the threshold`)
            _scanLogging.add(f.path, `   -> Rating ${lFilesWithRating.find(n => n.file.path === f.path)?.rating} | Highest rating ${highestRating}`)
            _scanLogging.add(f.path, `   -> Folder rating ${lFilesWithRating.find(n => n.file.path === f.path)?.ratingByFolderName} | Highest folder rating ${highestRatingByFolderName}`)
        })
        mostAccurateFiles.map(f => {
            _scanLogging.add(f.path, `File was accepted`)
            _scanLogging.add(f.path, `   -> Rating ${lFilesWithRating.find(n => n.file.path === f.path)?.rating} | Highest rating ${highestRating}`)
            _scanLogging.add(f.path, `   -> Folder rating ${lFilesWithRating.find(n => n.file.path === f.path)?.ratingByFolderName} | Highest folder rating ${highestRatingByFolderName}`)
            _scanLogging.add(f.path, `   -> Main file? ${!isNotMain(f)}`)
            _scanLogging.add(f.path, `   -> Media ID: ` + (f.mediaId || currentMedia.id))
        })

        logger("library-entry/inspectProspectiveLibraryEntry").info(`${currentMedia.title?.english} |`, "Accuracy", Number(highestRating.toFixed(3)))

        return {
            media: currentMedia, // Unused
            acceptedFiles: mostAccurateFiles,
            rejectedFiles: rejectedFiles,
            accuracy: Number(highestRating.toFixed(3)), // Unused
            sharedPath: firstFile?.path?.replace("\\" + firstFile?.parsedInfo?.original || "", "") || "", // Unused
            // /\ MAY NOT BE ACCURATE as some files might have different folders
        }
    }

    return {
        media: currentMedia,
        acceptedFiles: [],
        rejectedFiles: [],
        accuracy: 0,
        sharedPath: "",
    }
}

/* -------------------------------------------------------------------------------------------------
 * Rematch
 * -----------------------------------------------------------------------------------------------*/

export async function manuallyMatchFiles(
    filePaths: string[],
    type: "match" | "ignore",
    userName: string,
    token: string,
    malID?: string | undefined,
): Promise<{ error?: string, media?: AnilistShowcaseMedia }> {

    logger("library-entry/manuallyMatchFiles").info("1) Fetching user collection")
    const collectionQuery = await useAniListAsyncQuery(AnimeCollectionDocument, { userName })

    logger("library-entry/manuallyMatchFiles").info("2) Verifying that all files exist")
    if (filePaths.some(path => !(fs.existsSync(path)))) {
        logger("library-entry/manuallyMatchFiles").error("File does not exist", filePaths.filter(path => !(fs.existsSync(path))))
        return { error: "An error has occurred. Refresh your library entries." }
    }

    if (type === "match") {


        if (malID && !isNaN(Number(malID))) {

            try {
                logger("library-entry/manuallyMatchFiles").info("3) Trying to match files")
                const data = await useAniListAsyncQuery(AnimeByMalIdDocument, { id: Number(malID) }, token)

                if (!data.Media) {
                    return { error: "Could not find the anime on AniList" }
                }

                const animeExistsInUsersWatchList = collectionQuery.MediaListCollection?.lists?.some(list => !!list?.entries?.some(entry => entry?.media?.id === data.Media?.id)) ?? false

                if (!animeExistsInUsersWatchList) {
                    try {
                        const mutation = await useAniListAsyncQuery(UpdateEntryDocument, {
                            mediaId: data.Media.id, //Int
                            status: "PLANNING", //MediaListStatus
                        }, token)
                    } catch (e) {
                        logger("library-entry/manuallyMatchFiles").error("Error while adding anime to watch list")
                        return { error: "Could not add the anime to your watch list" }
                    }
                }

                // Return media so that the client updates the [LocalFile]s
                return { media: data.Media }

                // return { error: animeExistsInUsersWatchList ? "Anime exists in list" : "Anime doesn't exist in list" }

            } catch (e) {

                return { error: "Could not find/add the anime on AniList" }
            }

        } else {

            return { error: "Selected anime is incorrect" }

        }

    } else {

        return { error: undefined }

    }

}
