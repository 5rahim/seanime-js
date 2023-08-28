import { AnimeFileInfo } from "@/lib/local-library/local-file"

export function getLocalFileParsedSeason(fileParsed: AnimeFileInfo | undefined, folderParsed: AnimeFileInfo[]) {

    if (fileParsed) {

        const folderParsedSeason = Number(folderParsed.findLast(obj => !!obj.season)?.season)
        const folderSeason = !isNaN(folderParsedSeason) ? Number(folderParsedSeason) : undefined
        const fileSeason = !isNaN(Number(fileParsed?.season)) ? Number(fileParsed?.season) : undefined

        if (!!folderSeason && !!fileSeason) {
            return folderSeason !== fileSeason ? fileSeason : folderSeason
        }
        return folderSeason || fileSeason

    }

    return undefined

}

/**
 * This does NOT return the normalized episode number
 * @param parsedInfo
 */
export function getLocalFileParsedEpisode(parsedInfo: AnimeFileInfo | undefined) {
    return (!!parsedInfo?.episode && !isNaN(Number(parsedInfo?.episode))) ? Number(parsedInfo.episode) : undefined
}
