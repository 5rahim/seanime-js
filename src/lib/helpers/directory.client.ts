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
