import { Settings } from "@/atoms/settings"
import { logger } from "@/lib/helpers/debug"
import { createLocalFile, LocalFile } from "@/lib/local-library/local-file"
import _ from "lodash"
import { fileSnapshot } from "@/lib/local-library/mock"

export async function mock_getUniqueAnimeTitles(settings: Settings, filter?: string) {
    const currentPath = settings.library.localDirectory
    logger("mock_getUniqueAnimeTitles").info("Get unique anime titles")
    if (currentPath) {
        let localFiles: LocalFile[] = []
        await mock_getAllFilesRecursively(settings, currentPath, localFiles)
        logger("mock_getUniqueAnimeTitles").info(localFiles.length)
        logger("mock_getUniqueAnimeTitles").info("Grouping local files by unique anime title")

        const allAnimeTitles = localFiles.flatMap(n => [n?.parsedInfo?.title?.toLowerCase().trim(), ...n.parsedFolders.flatMap(n => n.title).filter(Boolean)].filter(Boolean)).map(n => n.toLowerCase())
        const uniqueTitles = removeContainedStrings(_.uniq(allAnimeTitles))

        return uniqueTitles
        // return localFiles.filter(n => n.name.toLowerCase().includes(filter.toLowerCase()))
    }
    return undefined
}

function removeContainedStrings(strings: string[]): string[] {
    const sortedStrings = _.sortBy(strings, "length")

    const result: string[] = []

    for (let i = 0; i < sortedStrings.length; i++) {
        const currentString = sortedStrings[i]
        let isContained = false

        for (let j = i + 1; j < sortedStrings.length; j++) {
            if (_.includes(sortedStrings[j], currentString)) {
                isContained = true
                break
            }
        }

        if (!isContained) {
            result.push(currentString)
        }
    }

    return result
}

/**
 * @deprecated
 */
async function mock_getAllFilesRecursively(
    settings: Settings,
    directoryPath: string,
    files: LocalFile[],
    allowedTypes: string[] = ["mkv", "mp4"],
): Promise<void> {
    logger("mock_getAllFilesRecursively").info("Fetching all files recursively")
    for (const item of fileSnapshot) {
        files.push(await createLocalFile(settings, {
            name: item.name,
            path: item.path,
        }))
    }
}
