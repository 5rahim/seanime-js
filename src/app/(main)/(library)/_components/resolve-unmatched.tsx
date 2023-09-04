"use client"

import React, { useEffect, useState } from "react"
import { Drawer } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { ImNext } from "@react-icons/all-files/im/ImNext"
import { ImPrevious } from "@react-icons/all-files/im/ImPrevious"
import { FcOpenedFolder } from "@react-icons/all-files/fc/FcOpenedFolder"
import { RadioGroup } from "@/components/ui/radio-group"
import Image from "next/image"
import { Alert } from "@/components/ui/alert"
import { manuallyMatchFiles } from "@/lib/local-library/library-entry"
import toast from "react-hot-toast"
import { useCurrentUser } from "@/atoms/user"
import { useAuthed } from "@/atoms/auth"
import { TextInput } from "@/components/ui/text-input"
import { Switch } from "@/components/ui/switch"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { libraryMatchingSuggestionGroupsAtom, useMatchingSuggestions } from "@/atoms/library/matching-suggestions.atoms"

import { libraryEntriesAtom } from "@/atoms/library/library-entry.atoms"
import { useSetLocalFiles } from "@/atoms/library/local-file.atoms"
import { useSelectAtom } from "@/atoms/helpers"
import { useAtomValue } from "jotai/react"
import { useRefreshAnilistCollection } from "@/atoms/anilist/collection.atoms"

/* -------------------------------------------------------------------------------------------------
 * ClassificationRecommendationHub
 * -----------------------------------------------------------------------------------------------*/

export function ResolveUnmatched(props: { isOpen: boolean, close: () => void }) {
    const { user } = useCurrentUser()
    const { token } = useAuthed()
    const groups = useAtomValue(libraryMatchingSuggestionGroupsAtom)
    const { getMatchingSuggestions, isLoading: isFetchingSuggestion } = useMatchingSuggestions()
    const setLocalFiles = useSetLocalFiles()

    const [isLoading, setIsLoading] = useState(false)
    const [groupBy, setGroupBy] = useState<"file" | "folder">("folder")

    const [index, setIndex] = useState(0)
    const [selectedAnimeId, setSelectedAnimeId] = useState<string | undefined>("0")

    const entriesMediaIds = useSelectAtom(libraryEntriesAtom, entries => entries.map(entry => entry.id))
    const refreshAnilistCollection = useRefreshAnilistCollection()

    useEffect(() => {
        setSelectedAnimeId("0")
    }, [index])

    const currentGroup = groups[index]

    const nonContentDetected = currentGroup?.files?.some(n => n.name.match(/\s(ED|OP)\s?/))
    const ovaDetected = currentGroup?.files?.some(n => n.name.match(/\s(OVA)\s?/))
    const specialsDetected = currentGroup?.files?.some(n => n.name.match(/\s(\()?[Ss]pecials(\))?\s?/))
    const episodeDetected = currentGroup?.files?.some(n => n.name.match(/\s([Ss]|[Ee])?0?\d{2,4}(?:.|$|E)/))

    function handleSelectAnime(value: string | null) {
        setSelectedAnimeId(value ?? "0")
    }

    const handleConfirm = async () => {
        if (user?.name && token) {
            setIsLoading(true)
            // props.close()
            const {
                error,
                mediaId,
            } = await manuallyMatchFiles(currentGroup.files.map(n => n.path), "match", user?.name, token, Number(selectedAnimeId))

            if (mediaId) {
                // Update stored local files
                setLocalFiles(files => {
                    for (const path of currentGroup.files.map(n => n.path)) {
                        const fileIndex = files.findIndex(file => file.path === path)
                        files[fileIndex].mediaId = mediaId
                        files[fileIndex].locked = true
                        files[fileIndex].ignored = false
                    }
                    return
                })
                const entriesMediaIdsSet = new Set([...entriesMediaIds])
                // If entry didn't exist, refresh collection
                if (!entriesMediaIdsSet.has(mediaId)) {
                    await refreshAnilistCollection()
                }

                setIndex(0)
                getMatchingSuggestions(groupBy)
            }
            if (error) {
                toast.error(error)
            }
            setIsLoading(false)
        }
    }

    const handleIgnore = async () => {
        if (user?.name) {
            setLocalFiles(files => {
                for (const path of currentGroup.files.map(n => n.path)) {
                    const fileIndex = files.findIndex(file => file.path === path)
                    files[fileIndex].ignored = true
                }
                return
            })
            setIndex(0)
            getMatchingSuggestions(groupBy)
        }
    }

    return (
        <Drawer
            isOpen={props.isOpen && (isFetchingSuggestion || groups.length > 0)}
            onClose={props.close}
            size={"xl"}
            isClosable
            title={"Resolve unmatched files"}
        >
            {(isFetchingSuggestion || groups.length > 0) && <Switch
                label={"Group by folders"}
                checked={groupBy === "folder"}
                containerClassName={"mb-4"}
                onChange={value => {
                    if (value) {
                        getMatchingSuggestions("folder")
                        setGroupBy("folder")
                    } else {
                        getMatchingSuggestions("file")
                        setGroupBy("file")
                    }
                    setIndex(0)
                }}
            />}

            {isFetchingSuggestion && <LoadingSpinner/>}

            {!currentGroup && <p>Nothing to see</p>}
            {(groups.length > 0 && !!currentGroup) && <div className={"space-y-4"}>

                <div className={"flex w-full justify-between"}>
                    <Button
                        intent={"gray-subtle"}
                        leftIcon={<ImPrevious/>}
                        onClick={() => setIndex(prev => prev > 0 ? prev - 1 : prev)}
                        isDisabled={index === 0}
                    >Previous</Button>
                    <Button
                        intent={"gray-subtle"}
                        rightIcon={<ImNext/>}
                        onClick={() => setIndex(prev => (prev + 1) < groups.length ? prev + 1 : prev)}
                        isDisabled={index === groups.length - 1}
                    >Next</Button>
                </div>

                <div className={"flex items-center gap-2"}>
                    <span className={"text-xl"}><FcOpenedFolder/></span>
                    {currentGroup.folderPath}
                </div>

                {(nonContentDetected || specialsDetected || ovaDetected || episodeDetected) && <Alert
                    intent={"warning"}
                    title={"Warnings"}
                    description={<>
                        <ul className={"list-disc pl-5 mt-1"}>
                            {nonContentDetected &&
                                <li>ED or OP files were detected in this folder, delete these files or mark this folder
                                    as ignored</li>}
                            {ovaDetected &&
                                <li>OVA files were detected in this folder, rename these files with the correct AniList
                                    title and move them to separate and appropriately named folders.</li>}
                            {specialsDetected &&
                                <li>Specials detected, rename these files with the correct AniList title and move them
                                    to separate and appropriately named folders</li>}
                            {episodeDetected && <li>Episodes were detected:</li>}
                            {episodeDetected && <li>{`-->`} The anime was not added to your watch list</li>}
                            {episodeDetected &&
                                <li>{`-->`} It was unmatched because the episode number is greater than the original
                                    media's number of episodes</li>}
                            {episodeDetected && <li>{`-->`} Your structure or naming is inconsistent</li>}
                        </ul>
                    </>}
                />}

                <div className={"max-h-72 overflow-y-auto border border-[--border] rounded-md p-4"}>
                    {currentGroup.files.map(file => {
                        return (
                            <p className={"text-md"} key={file.path}>
                                <span className={""}>{file.parsedInfo?.original}</span>
                            </p>
                        )
                    })}
                </div>
                <div className={"space-y-4"}>
                    <RadioGroup
                        defaultValue="1"
                        fieldClassName="w-full"
                        fieldLabelClassName="text-md"
                        label="Select Anime"
                        value={selectedAnimeId}
                        onChange={handleSelectAnime}
                        options={currentGroup.recommendations.map((media) => (
                            {
                                label: media.title?.userPreferred,
                                value: String(media.id) || "",
                                help: <div className={"mt-2 flex w-full gap-4"}>
                                    {media.coverImage?.medium && <div
                                        className="h-28 w-28 flex-none rounded-md object-cover object-center relative overflow-hidden">
                                        <Image
                                            src={media.coverImage.medium}
                                            alt={""}
                                            fill
                                            quality={100}
                                            priority
                                            sizes="10rem"
                                            className="object-cover object-center"
                                        />
                                    </div>}
                                    <div className={"text-[--muted]"}>
                                        <p className={"line-clamp-1"}>{media.title?.english}</p>
                                        <p>Type: <span
                                            className={"text-gray-200 font-semibold"}>{media.format}</span>
                                        </p>
                                        <p>Aired: {media.startDate?.year ? new Intl.DateTimeFormat("en-US", {
                                            year: "numeric",
                                        }).format(new Date(media.startDate?.year || 0, media.startDate?.month || 0)) : "-"}</p>
                                        <p>Status: {media.status}</p>
                                        <Button
                                            intent={"primary-link"}
                                            size={"sm"}
                                            className={"px-0"}
                                            onClick={() => window.open(`https://anilist.co/anime/${media.id}`, "_target")}
                                        >Open on AniList</Button>
                                    </div>
                                </div>,
                            }
                        ))}
                        radioContainerClassName="block w-full p-4 cursor-pointer dark:bg-gray-900 transition border border-[--border] rounded-[--radius] data-[checked=true]:ring-2 ring-[--ring]"
                        radioControlClassName="absolute right-2 top-2 h-5 w-5 text-xs"
                        radioHelpClassName="text-sm"
                        radioLabelClassName="font-semibold flex-none flex"
                        stackClassName="grid grid-cols-2 gap-2 space-y-0"
                    />

                    <TextInput
                        label={"Or enter AniList ID"}
                        value={selectedAnimeId}
                        onChange={e => handleSelectAnime(e.target.value)}
                        // help={"Leave at 0"}
                    />

                    <ul className={"list-disc pl-6"}>
                        <li>Good to know: It is recommended that you manually solve the matching issues by
                            renaming/removing files and refreshing the entries instead. See guide for more information.
                        </li>
                    </ul>

                    <div className={"flex gap-2"}>
                        <Button intent={"success"} onClick={handleConfirm} isDisabled={isLoading}>Confirm</Button>
                        <Button intent={"alert-link"} onClick={handleIgnore} isDisabled={isLoading}>
                            Mark files as ignored
                        </Button>
                    </div>
                </div>
            </div>}
        </Drawer>
    )

}
