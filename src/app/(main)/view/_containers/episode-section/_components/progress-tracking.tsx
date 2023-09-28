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
import { anilist_getEpisodeCeilingFromMedia } from "@/lib/anilist/utils"

interface ProgressTrackingModalProps {
    children?: React.ReactNode
    media: AnilistDetailedMedia
    mediaIncludesSpecial: boolean
    progress?: number | null
}

export const __progressTrackingAtom = atomWithImmer<{ open: boolean, filesWatched: LocalFile[] }>({
    open: false,
    filesWatched: [],
})

export const ProgressTrackingModal: React.FC<ProgressTrackingModalProps> = (props) => {

    const { children, media, progress, mediaIncludesSpecial, ...rest } = props

    const [state, setState] = useAtom(__progressTrackingAtom)

    const { watchedEntry } = useWatchedAnilistEntry()

    const maxEp = anilist_getEpisodeCeilingFromMedia(media)

    const files = useMemo(() => sortBy(state.filesWatched, file => file.metadata.episode), [state.filesWatched])
    const latestFile = useMemo(() => files[files.length - 1], [files])

    const epWatched = useMemo(() => mediaIncludesSpecial ? ((latestFile?.metadata?.episode ?? 1) + 1) : latestFile?.metadata?.episode ?? 1, [latestFile, mediaIncludesSpecial])

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
                    {(epWatched <= maxEp) && <Button
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
