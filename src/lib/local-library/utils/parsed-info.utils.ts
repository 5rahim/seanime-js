import { AnimeFileInfo } from "@/lib/local-library/types"

export function localFile_getParsedSeason(parsedInfo: AnimeFileInfo | undefined, folderParsedInfo: AnimeFileInfo[]) {

    if (parsedInfo) {

        const folderParsedSeason = Number(folderParsedInfo.findLast(obj => !!obj.season)?.season)
        const folderSeason = !isNaN(folderParsedSeason) ? Number(folderParsedSeason) : undefined
        const fileSeason = !isNaN(Number(parsedInfo?.season)) ? Number(parsedInfo?.season) : undefined

        if (!!folderSeason && !!fileSeason) { // Prefer the file season when both exist
            return folderSeason !== fileSeason ? fileSeason : folderSeason
        }
        return folderSeason || fileSeason // Prefer the folder season when only one exists

    }

    return undefined

}

/**
 * @description
 * This does NOT return the normalized episode number, only the parsed one
 */
export function localFile_getParsedEpisode(parsedInfo: AnimeFileInfo | undefined) {
    return (!!parsedInfo?.episode && !isNaN(Number(parsedInfo?.episode))) ? Number(parsedInfo.episode) : undefined
}
