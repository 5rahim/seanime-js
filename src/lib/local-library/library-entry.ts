"use server"
import { LocalFileWithMedia } from "@/lib/local-library/local-file"
import { AnilistSimpleMedia } from "@/lib/anilist/fragment"
import similarity from "string-similarity"
import { logger } from "@/lib/helpers/debug"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeByMalIdDocument, AnimeCollectionDocument, UpdateEntryDocument } from "@/gql/graphql"
import fs from "fs"
import { ANIDB_RX } from "@/lib/series-scanner/regex"

export type LibraryEntry = {
    filePaths: Array<string>
    media: AnilistSimpleMedia
    accuracy: number
    sharedPath: string
}

/**
 * A [LibraryEntry] represents a single [AnilistSimpleMedia] and its associated local files.
 */
export const createLibraryEntry = async (props: {
    media: AnilistSimpleMedia,
    files: LocalFileWithMedia[]
}): Promise<LibraryEntry & { acceptedFiles: LocalFileWithMedia[], rejectedFiles: LocalFileWithMedia[] }> => {

    const currentMedia = props.media
    const lFiles = props.files.filter(f => f.media?.id === currentMedia?.id)

    if (lFiles.length && lFiles.length > 0) {
        // Return each file with a rating
        const lFilesWithRating = lFiles.map(f => {
            // Select the file's media titles
            const mediaTitles = [currentMedia?.title?.english, currentMedia?.title?.romaji, currentMedia?.title?.userPreferred].filter(Boolean).map(n => n.toLowerCase())
            // Get the file's parent folder anime title
            const fileFolderTitle = f.parsedFolderInfo.findLast(n => !!n.title)?.title
            // Get the file's anime title
            const fileTitle = f.parsedInfo?.title
            // Get the file's parent folder original name
            const fileFolderOriginal = f.parsedFolderInfo.findLast(n => !!n.title)?.original

            let rating = 0
            let ratingByFolderName = 0

            /** Rate how the file's parameters matches with the actual anime title **/

            // Rate the file's parent folder anime title
            if (fileFolderTitle && mediaTitles.length > 0) {
                const bestMatch = similarity.findBestMatch(fileFolderTitle.toLowerCase(), mediaTitles)
                rating = bestMatch.bestMatch.rating
            }
            // Rate the file's anime title
            if (fileTitle && mediaTitles.length > 0) {
                const bestMatch = similarity.findBestMatch(fileTitle.toLowerCase(), mediaTitles)
                rating = bestMatch.bestMatch.rating > rating ? bestMatch.bestMatch.rating : rating
            }
            // Rate the file's parent folder original name
            if (fileFolderOriginal) {
                const bestMatch = similarity.findBestMatch(fileFolderOriginal.toLowerCase(), mediaTitles)
                ratingByFolderName = bestMatch.bestMatch.rating
            }
            return {
                file: f,
                rating: rating,
                ratingByFolderName,
            }
        })
        const highestRating = Math.max(...lFilesWithRating.map(item => item.rating))
        const highestRatingByFolderName = Math.max(...lFilesWithRating.map(item => item.ratingByFolderName))

        const isNotMain = (file: LocalFileWithMedia) => {
            return (
                ANIDB_RX[0].test(file.path) ||
                ANIDB_RX[1].test(file.path) ||
                ANIDB_RX[2].test(file.path) ||
                ANIDB_RX[4].test(file.path)
            )
        }


        // This is meant to filter out files that differ from the best matches
        // For example this can help avoid having different season episodes under the same Anime
        const mostAccurateFiles = lFilesWithRating
            // Keep files with a rating greater than 0.4
            .filter(item => item.rating >= 0.4 || isNotMain(item.file))
            // If a file has a lower rating than the highest, filter it out
            .filter(item => item.rating.toFixed(3) === highestRating.toFixed(3) || isNotMain(item.file))
            // If a file's parent folder name has a lower rating than the highest, filter it out
            .filter(item => item.ratingByFolderName.toFixed(3) === highestRatingByFolderName.toFixed(3) || isNotMain(item.file))
            .map(item => item.file)

        const rejectedFiles = lFiles.filter(n => !mostAccurateFiles.find(f => f.path === n.path))

        const firstFile = mostAccurateFiles[0]
        return {
            media: currentMedia,
            filePaths: mostAccurateFiles.map(file => file.path),
            acceptedFiles: mostAccurateFiles,
            rejectedFiles: rejectedFiles,
            accuracy: Number(highestRating.toFixed(3)),
            sharedPath: firstFile?.path?.replace("\\" + firstFile?.parsedInfo?.original || "", "") || "", // MAY NOT BE ACCURATE
        }
    }

    return {
        media: currentMedia,
        acceptedFiles: [],
        rejectedFiles: [],
        filePaths: [],
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
): Promise<{ error?: string, media?: AnilistSimpleMedia }> {

    logger("library-entry/manuallyMatchFiles").info("1) Fetching user collection")
    const collectionQuery = await useAniListAsyncQuery(AnimeCollectionDocument, { userName })

    logger("library-entry/manuallyMatchFiles").info("2) Verifying that all files exist")
    if (filePaths.some(path => !(fs.existsSync(path)))) {
        logger("library-entry/manuallyMatchFiles").error("File does not exist", filePaths.filter(path => !(fs.existsSync(path))))
        return { error: "An error occurred. Refresh your library entries" }
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
                            score: undefined, //Float
                            progress: undefined, //Int
                            repeat: undefined, //Int
                            private: false, //Boolean
                            notes: undefined, //String
                            hiddenFromStatusLists: true, //Boolean
                            startedAt: undefined, //FuzzyDateInput
                            completedAt: undefined, //FuzzyDateInput
                        }, token)
                    } catch (e) {
                        logger("library-entry/manuallyMatchFiles").error("Error while adding anime to watch list")
                        return { error: "Could not add the anime to your watch list" }
                    }
                }

                // Return media so that the client updates [sea-library-entries] and [sea-local-files-with-no-match]
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
