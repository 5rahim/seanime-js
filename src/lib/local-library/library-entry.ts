import { LocalFile, LocalFileWithMedia } from "@/lib/local-library/local-file"
import { AnilistSimpleMedia } from "@/lib/anilist/fragment"
import similarity from "string-similarity"

export type LibraryEntry = {
    files: Array<LocalFile>
    media: AnilistSimpleMedia
    accuracy: number
    sharedPath: string
}

/**
 * A [LibraryEntry] represents a single [AnilistSimpleMedia] and its associated local files.
 */

export const createLibraryEntry = (props: { media: AnilistSimpleMedia, files: LocalFileWithMedia[] }): LibraryEntry & {
    rejectedFiles: LocalFileWithMedia[]
} => {

    const currentMedia = props.media
    const lFiles = props.files.filter(f => f.media?.id === currentMedia?.id)

    if (lFiles.length && lFiles.length > 0) {
        // Return each file with a rating
        const lFilesWithRating = lFiles.map(f => {
            // Select the file's media titles
            const mediaTitles = [currentMedia?.title?.english, currentMedia?.title?.romaji, currentMedia?.title?.userPreferred].filter(Boolean).map(n => n.toLowerCase())
            // Get the file's parent folder anime title
            const fileFolderTitle = f.parsedFolders.findLast(n => !!n.title)?.title
            // Get the file's anime title
            const fileTitle = f.parsedInfo?.title
            // Get the file's parent folder original name
            const fileFolderOriginal = f.parsedFolders.findLast(n => !!n.title)?.original

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

        // This is meant to filter out files that differ from the best matches
        // For example this can help avoid having different season episodes under the same Anime
        const mostAccurateFiles = lFilesWithRating
            // If a file has a lower rating than the highest, filter it out
            .filter(item => item.rating.toFixed(3) === highestRating.toFixed(3))
            // If a file's parent folder name has a lower rating than the highest, filter it out
            .filter(item => item.ratingByFolderName.toFixed(3) === highestRatingByFolderName.toFixed(3))
            .map(item => item.file)

        const rejectedFiles = lFiles.filter(n => !mostAccurateFiles.find(f => f.path === n.path))

        const firstFile = mostAccurateFiles[0]
        return {
            media: currentMedia,
            files: mostAccurateFiles,
            accuracy: Number(highestRating.toFixed(3)),
            sharedPath: firstFile.path.replace("\\" + firstFile.parsedInfo?.original || "", ""), // MAY NOT BE ACCURATE
            rejectedFiles: rejectedFiles,
        }
    }

    return {
        media: currentMedia,
        files: [],
        accuracy: 0,
        sharedPath: "",
        rejectedFiles: [],
    }
}
