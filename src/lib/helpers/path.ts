import * as upath from "upath"

export function sanitizeDirectoryName(input: string, trimMultipleSpaces: boolean = true): string {
    const disallowedChars = /[<>:"/\\|?*\x00-\x1F]/g // Pattern for disallowed characters
    // Replace disallowed characters with an underscore
    let value = input.replace(disallowedChars, " ")
    // Remove leading/trailing spaces and dots (periods) which are not allowed
    value = value.trim().replace(/^\.+|\.+$/g, "")
    if (trimMultipleSpaces) value = value.replace(/\s+/g, " ")
    // Ensure the directory name is not empty after sanitization
    return value || "Untitled"
}

export function path_splitPath(inputPath: string): string[] {
    // Normalize the path to handle different platform-specific path separators
    const normalizedPath = upath.normalize(inputPath)

    // Use upath.sep to split the path into individual folder names
    const folderNames = normalizedPath.split(upath.sep)

    // Filter out any empty folder names
    return folderNames.filter((folder) => folder.length > 0)
}

/**
 * @param inputPath
 * @example
 * removeTopDirectory("E:/Anime/Jujutsu Kaisen")
 * // => Anime/Jujutsu Kaisen
 */
export function path_removeTopDirectory(inputPath: string): string | null {
    // Normalize the path to handle different platform-specific path separators
    const normalizedPath = upath.normalize(inputPath)

    // Use upath.sep to split the path into individual folder names
    const folderNames = normalizedPath.split(upath.sep)

    // Ensure there are at least two folder names in the path
    if (folderNames.length >= 2) {
        // Remove the first folder name (top directory)
        folderNames.shift()

        // Join the remaining folder names to form the new path
        const newPath = folderNames.join(upath.sep)

        return newPath
    }

    // If there are not enough folder names, return null
    return null
}

/**
 * @param inputPath
 * @param topPath
 * @example
 * removeTopPath("E:/Anime/Jujutsu Kaisen/01.mkv", "E:/Anime")
 * // => Jujutsu Kaisen/01.mkv
 */
export function path_removeTopPath(inputPath: string, topPath: string) {
    // Normalize the paths to handle different platform-specific path separators
    const normalizedInputPath = upath.normalize(inputPath)
    const normalizedTopPath = upath.normalize(topPath)

    // Split the paths into individual folder names
    const inputFolderNames = normalizedInputPath.split(upath.sep)
    const topFolderNames = normalizedTopPath.split(upath.sep)

    // Check if the inputPath starts with the specified topPath
    const isTopPathMatch = topFolderNames.every((folderName, index) => {
        return folderName === inputFolderNames[index]
    })

    if (isTopPathMatch) {
        // Remove the topPath segment from the inputPath
        const remainingFolderNames = inputFolderNames.slice(topFolderNames.length)
        const newPath = remainingFolderNames.join(upath.sep)

        return newPath
    }

    // If the topPath is not found in the inputPath, return inputPath
    return inputPath
}

export function path_getDirectoryName(input: string) {
    const normalized = upath.normalize(input)
    return upath.dirname(normalized)
}

export function path_getBasename(input: string) {
    const normalized = upath.normalize(input)
    return upath.basename(normalized)
}

/**
 * /!\ Doesn't work in browser
 * @param input
 */
export function path_isAbsolute_SERVER_ONLY(input: string) {
    const normalized = upath.normalize(input)
    return upath.isAbsolute(normalized)
}
