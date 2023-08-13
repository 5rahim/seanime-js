import { LocalFile } from "@/lib/local-library/local-file"
import { AnilistMedia } from "@/lib/anilist/fragment"

export type LibraryEntry = {
    entries: Array<LocalFile>
    media: AnilistMedia
}

/**
 * [LibraryEntry] represents a file on the host machine.
 * - Use [path] to identity the file
 */

export const createLibraryEntry = (props: Pick<LibraryEntry, "entries" | "media">) => {
    return {
        entries: props.entries,
        media: props.media,
    }
}
