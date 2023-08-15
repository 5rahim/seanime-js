import { LocalFile } from "@/lib/local-library/local-file"
import { AnilistSimpleMedia } from "@/lib/anilist/fragment"

export type LibraryEntry = {
    files: Array<LocalFile>
    media: AnilistSimpleMedia | undefined
    sharedPath: string
    hasMedia: boolean
}

/**
 * A [LibraryEntry] represents a single [AnilistSimpleMedia] and its associated local files.
 */
export const createLibraryEntry = (props: Pick<LibraryEntry, "files" | "media" | "sharedPath">): LibraryEntry => {
    return {
        files: props.files,
        media: props.media,
        sharedPath: props.sharedPath,
        hasMedia: !!props.media,
    }
}
