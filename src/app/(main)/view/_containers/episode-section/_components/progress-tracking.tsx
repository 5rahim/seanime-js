import React, { startTransition, useMemo } from "react"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useAtom } from "jotai"
import { useWatchedAnilistEntry } from "@/atoms/anilist/entries.atoms"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import sortBy from "lodash/sortBy"
import { atomWithImmer } from "jotai-immer"
import { LocalFile } from "@/lib/local-library/types"
import { anilist_getCurrentEpisodeCeilingFromMedia } from "@/lib/anilist/utils"
import { useLibraryEntryDynamicDetails } from "@/atoms/library/local-file.atoms"
import { localFile_episodeExists } from "@/lib/local-library/utils/episode.utils"

interface ProgressTrackingModalProps {
    media: AnilistDetailedMedia
}

export const __progressTrackingAtom = atomWithImmer<{ open: boolean, filesWatched: LocalFile[] }>({
    open: false,
    filesWatched: [],
})

export function ProgressTrackingModal(props: ProgressTrackingModalProps) {

    const { media } = props

    const [state, setState] = useAtom(__progressTrackingAtom)

    const { watchedEntry } = useWatchedAnilistEntry()

    const maxEp = anilist_getCurrentEpisodeCeilingFromMedia(media)
    const { specialIsIncluded } = useLibraryEntryDynamicDetails(media.id)

    /**
     * - Sort the watched files by episode number
     * - Get the one with the highest episode number
     */
    const files = useMemo(() => sortBy(state.filesWatched, file => file.metadata.episode), [state.filesWatched])
    const latestFile = useMemo(() => files[files.length - 1], [files])


    const epWatched = useMemo(() => {
        // Make sure the episode number is not undefined
        if (!localFile_episodeExists(latestFile)) return undefined
        // [EPISODE-ZERO-SUPPORT]
        // If the special is included, add 1 to the episode number
        // This is because the episode number is 0-indexed
        // e,g, if the latest episode number is 0, the user has watched 1 episode
        if (specialIsIncluded) {
            return latestFile.metadata.episode! + 1
        }
        return latestFile.metadata.episode
    }, [latestFile, specialIsIncluded])

    return <>
        <Modal
            isOpen={state.open}
            onClose={() => setState(draft => {
                draft.open = false
                return
            })}
            title={"Progress"}
            titleClassName={"text-center"}
            isClosable
        >
            <div className={"space-y-4 text-center"}>
                <div className={"text-center text-lg"}>
                    <p>
                        {media.format !== "MOVIE"
                            ? `You've watched ${state.filesWatched.length} episode${state.filesWatched.length === 1 ? "" : "s"}.`
                            : files.length > 0 ? `You have completed ${media.title?.userPreferred}.` : `You haven't completed ${media.title?.userPreferred} yet.`}
                    </p>
                    {media.format !== "MOVIE" && files.length > 0 && !!latestFile && (
                        <p className={"bg-[--background-color] rounded-md text-center p-4 mt-4 text-xl"}>Current
                            progress: <Badge size={"lg"}>{epWatched} /<span
                                className={"opacity-60"}>{maxEp}</span></Badge></p>
                    )}
                </div>
                <div className={"flex gap-2 justify-center items-center"}>
                    {(!!epWatched && epWatched <= maxEp) && <Button
                        intent={"success"}
                        isDisabled={state.filesWatched.length === 0}
                        onClick={() => {
                            setState(draft => {
                                draft.open = false
                                draft.filesWatched = []
                                return
                            })
                            startTransition(() => {
                                watchedEntry({
                                    mediaId: media.id,
                                    episode: epWatched,
                                })
                            })
                        }}
                    >
                        Confirm
                    </Button>}
                    <Button intent={"warning-subtle"} onClick={() => {
                        setState(draft => {
                            draft.open = false
                            draft.filesWatched = []
                            return
                        })
                    }}>Cancel</Button>
                </div>
            </div>
        </Modal>
    </>

}
export const ProgressTrackingButton = () => {

    const [state, setState] = useAtom(__progressTrackingAtom)

    if (state.filesWatched.length === 0) return null

    return <Button
        intent={"success"}
        className={"animate-bounce"}
        onClick={() => {
            setState(draft => {
                draft.open = true
                return
            })
        }}
    >Update progress</Button>

}
