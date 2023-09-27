"use client"
import React, { useCallback, useEffect, useState } from "react"
import { Modal } from "@/components/ui/modal"
import { useAtom, useSetAtom } from "jotai/react"
import { atomWithImmer } from "jotai-immer"
import {
    __useRerenderLocalFiles,
    useMainLocalFilesByMediaId_UNSTABLE,
    useSetLocalFiles,
} from "@/atoms/library/local-file.atoms"
import { LocalFile } from "@/lib/local-library/types"
import { useStableSelectAtom } from "@/atoms/helpers"
import { allUserMediaAtom } from "@/atoms/anilist/media.atoms"
import { Checkbox } from "@/components/ui/checkbox"
import { path_getBasename } from "@/lib/helpers/path"
import { NumberInput } from "@/components/ui/number-input"
import { Nullish } from "@/types/common"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import { Select } from "@/components/ui/select"
import { localFile_getAniDBEpisodeInteger } from "@/lib/local-library/utils"
import { BetaBadge } from "@/components/application/beta-badge"

const __episodeOffsetActionModalAtom = atomWithImmer<{ open: boolean, mediaId: number | null }>({
    open: false,
    mediaId: null,
})

const __episodeOffsetActionFilesAtom = atomWithImmer<{ file: LocalFile, selected: boolean }[]>([])

export function EpisodeOffsetAction() {

    const [state, setState] = useAtom(__episodeOffsetActionModalAtom)

    return (
        <>
            <Modal
                isOpen={state.open}
                onClose={() => setState(draft => {
                    draft.open = false
                    return
                })}
                size={"xl"}
                title={<span>Offset episode numbers <BetaBadge/></span>}
                titleClassName={"text-center"}
                isClosable
            >
                <Content/>
            </Modal>
        </>
    )

}

function Content() {

    const [state, setState] = useAtom(__episodeOffsetActionModalAtom)
    const [files, setFiles] = useAtom(__episodeOffsetActionFilesAtom)
    const [offset, setOffset] = useState(0)
    const [area, setArea] = useState<"episode" | "aniDBEpisodeNumber">("episode")
    const setLocalFiles = useSetLocalFiles()

    const media = useStableSelectAtom(allUserMediaAtom, media => media.find(m => m.id === state.mediaId))
    const localFiles = useMainLocalFilesByMediaId_UNSTABLE(state.mediaId)
    const rerenderLocalFiles = __useRerenderLocalFiles()

    useEffect(() => {
        setFiles(localFiles.map(file => ({ file, selected: true })))
    }, [state.mediaId, localFiles])

    function applyOffset() {
        setLocalFiles(draft => {
            for (const { file, selected } of files) {
                const index = draft.findIndex(f => f.path === file.path)
                if (selected && index !== -1) {
                    if (area === "episode") {
                        draft[index].metadata.episode = calculateOffset(file.metadata.episode)
                    } else if (area === "aniDBEpisodeNumber") {
                        draft[index].metadata.aniDBEpisodeNumber = String(calculateOffset(localFile_getAniDBEpisodeInteger(file)))
                    }
                }
            }
            return
        })
        rerenderLocalFiles()
        toast.success("Offset applied")
        setState(draft => {
            draft.open = false
            return
        })
    }

    const getEpisode = useCallback((file: LocalFile) => {
        if (area === "episode") return file.metadata.episode!
        else if (area === "aniDBEpisodeNumber") return (localFile_getAniDBEpisodeInteger(file) || 0)
        else return 0
    }, [area])

    useEffect(() => {
        setOffset(0)
    }, [files, media])

    function calculateOffset(currentEpisode: Nullish<number>) {
        if (!currentEpisode) return 0
        // Make sure it is not less than 0
        return Math.max(1, currentEpisode + offset)
    }

    // Re-render the offset input when a selection changes
    // This is a workaround to make sure that the `files` referenced by the input is always up-to-date
    const OffsetInput = useCallback(() => {
        return !!media && <NumberInput
            label={"Offset"}
            value={offset}
            onChange={value => {
                const episodesArr = files.filter(n => n.selected).map(({ file }) => Math.max(0, getEpisode(file)! + value))
                // Make sure than we can't go any further below if one episode calculated offset is 0
                if (value < 0) {
                    const minOffset = Math.min(...episodesArr)
                    if (minOffset === 0) return
                    else setOffset(value)
                }
                // Make sure than we can't go any further above if one episode calculated offset is greater than the total number of episodes
                const maxOffset = Math.max(...episodesArr)
                if (!!media.episodes && maxOffset > media.episodes) {
                    return
                }
                setOffset(value)
            }}
            discrete
            min={-Infinity}
            step={1}
            minFractionDigits={0}
            maxFractionDigits={0}
        />
    }, [files, media, area])

    if (!media) return null

    return (
        <div className={"space-y-2 mt-2"}>
            <div className={"max-h-96 overflow-y-auto px-2 space-y-2"}>
                <Select
                    label={"Target"}
                    value={area}
                    options={[
                        { label: "Episode", value: "episode" },
                        { label: "AniDB episode number", value: "aniDBEpisodeNumber" },
                    ]}
                    onChange={e => {
                        setArea(e.target.value as any)
                    }}
                />
                {<OffsetInput/>}
                {files.map(({ file, selected }, index) => (
                    <div
                        key={`${file.path}-${index}`}
                        className={"p-2 border-b border-[--border]"}
                    >
                        <div className={"flex items-center"}>
                            <Checkbox
                                label={`${area === "episode" ? "Episode" : "AniDB Episode"} ${getEpisode(file)}`}
                                checked={selected}
                                onChange={checked => {
                                    if (typeof checked === "boolean") {
                                        setFiles(draft => {
                                            draft[index].selected = checked
                                            return
                                        })
                                    }
                                }}
                                fieldClassName={"w-[fit-content]"}
                            />
                            {selected && <p
                                className={"text-[--muted] line-clamp-1 ml-2 flex-none"}
                            >
                                {`->`} <span
                                className={"font-medium text-brand-300"}>{calculateOffset(getEpisode(file))}</span>
                            </p>}
                        </div>
                        <div>
                            <p className={"text-[--muted] text-sm line-clamp-1"}>
                                {path_getBasename(file.path)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <div className={"flex justify-end gap-2 mt-2"}>
                <Button
                    intent={"primary"}
                    onClick={() => applyOffset()}
                >
                    Apply
                </Button>
                <Button
                    intent={"white"}
                    onClick={() => setState(draft => {
                        draft.open = false
                        return
                    })}
                >
                    Cancel
                </Button>
            </div>
        </div>
    )
}

export default EpisodeOffsetAction

/* -------------------------------------------------------------------------------------------------
 * Helper hook
 * -----------------------------------------------------------------------------------------------*/

export function __useEpisodeOffsetAction() {
    const setter = useSetAtom(__episodeOffsetActionModalAtom)
    return {
        openEpisodeOffsetActionModal: (props: { mediaId: number }) => {
            setter(draft => {
                draft.open = true
                draft.mediaId = props.mediaId
                return
            })

        },
    }
}
