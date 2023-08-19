"use client"

import React, { useEffect, useState } from "react"
import { useLibraryEntries, useMatchingRecommendation, useStoredLocalFiles } from "@/atoms/library"
import { Drawer } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { ImNext } from "@react-icons/all-files/im/ImNext"
import { ImPrevious } from "@react-icons/all-files/im/ImPrevious"
import { useSettings } from "@/atoms/settings"
import { FcOpenedFolder } from "@react-icons/all-files/fc/FcOpenedFolder"
import { RadioGroup } from "@/components/ui/radio-group"
import Image from "next/image"
import { Alert } from "@/components/ui/alert"
import { manuallyMatchFiles } from "@/lib/local-library/library-entry"
import toast from "react-hot-toast"
import { useCurrentUser } from "@/atoms/user"
import { useAuthed } from "@/atoms/auth"
import { TextInput } from "@/components/ui/text-input"

/* -------------------------------------------------------------------------------------------------
 * ClassificationRecommendationHub
 * -----------------------------------------------------------------------------------------------*/


export function ClassificationRecommendationHub(props: { isOpen: boolean, close: () => void }) {
    const { settings } = useSettings()
    const { user } = useCurrentUser()
    const { token } = useAuthed()
    const { groups } = useMatchingRecommendation()
    const { setEntries } = useLibraryEntries()
    const { setLocalFiles } = useStoredLocalFiles()


    const [isLoading, setIsLoading] = useState(false)

    const [index, setIndex] = useState(0)
    const [selectedAnimeId, setSelectedAnimeId] = useState<string | undefined>("0")

    useEffect(() => {
        setSelectedAnimeId("0")
    }, [index])

    const currentGroup = groups[index]

    const nonContentDetected = currentGroup?.files?.some(n => n.name.match(/\s(ED|OP)\s?/))
    const ovaDetected = currentGroup?.files?.some(n => n.name.match(/\s(OVA)\s?/))
    const specialsDetected = currentGroup?.files?.some(n => n.name.match(/\s(\()?[Ss]pecials(\))?\s?/))
    const episodeDetected = currentGroup?.files?.some(n => n.name.match(/\s([Ss]|[Ee])?0?\d{2,4}(?:.|$|E)/))

    if (groups.length === 0) return <div></div>

    function handleSelectAnime(value: string | null) {
        setSelectedAnimeId(value ?? "0")
    }

    const handleConfirm = async () => {
        if (user?.name && token) {
            setIsLoading(true)
            props.close()
            const {
                error,
                media,
            } = await manuallyMatchFiles(currentGroup.files.map(n => n.path), "match", user?.name, token, selectedAnimeId)

            if (media) {
                // Update stored local files
                setLocalFiles(files => {
                    for (const path of currentGroup.files.map(n => n.path)) {
                        const fileIndex = files.findIndex(file => file.path === path)
                        files[fileIndex].mediaId = media.id
                        files[fileIndex].locked = true
                    }
                    return
                })
                // Add entry if it doesn't exist
                setEntries(entries => {
                    const entriesMediaIds = new Set(entries.map(entry => entry.media.id))
                    if (!entriesMediaIds.has(media.id)) {
                        entries.push({
                            media: media,
                            filePaths: currentGroup.files.map(n => n.path),
                            sharedPath: currentGroup.folderPath,
                            accuracy: 1,
                        })
                    }
                    return
                })
                setIndex(0)
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
        }
    }

    return (
        <Drawer
            isOpen={props.isOpen}
            onClose={props.close}
            size={"xl"}
            isClosable
            title={"Resolve unmatched files"}
        >
            {!!currentGroup && <div className={"space-y-4"}>

                <Alert
                    title={"Refresh entries after manually renaming/moving files"}
                    intent={"alert"}
                />

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
                            {episodeDetected && <li>Episodes were detected, it might be because:</li>}
                            {episodeDetected && <li>{`-->`} The anime was not added to your watch list</li>}
                            {episodeDetected && <li>{`-->`} The episode number is greater than the original media</li>}
                            {episodeDetected && <li>{`-->`} Another folder is present where the files are located</li>}
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
                        options={currentGroup.recommendations.map((media: any) => (
                            {
                                label: media.name,
                                value: String(media.id) || "",
                                help: <div className={"mt-2 flex w-full gap-4"}>
                                    <div
                                        className="h-24 w-24 flex-none rounded-md object-cover object-center relative overflow-hidden">
                                        <Image
                                            src={media.image_url}
                                            alt={""}
                                            fill
                                            quality={100}
                                            priority
                                            sizes="10rem"
                                            className="object-cover object-center"
                                        />
                                    </div>
                                    <div className={"text-[--muted]"}>
                                        <p>Type: <span
                                            className={"text-gray-200 font-semibold"}>{media.payload?.media_type}</span>
                                        </p>
                                        <p>Aired: {media.payload?.aired}</p>
                                        <p>Status: {media.payload?.status}</p>
                                        <Button intent={"primary-link"} size={"sm"} className={"px-0"}
                                                onClick={() => window.open(media.url, "_target")}>Open on MAL</Button>
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

                    <TextInput label={"Or enter AniList ID"} value={selectedAnimeId}
                               onChange={e => handleSelectAnime(e.target.value)}/>

                    <ul className={"list-disc pl-6"}>
                        <li>Good to know: It is recommended that you manually solve the matching issues by
                            renaming/removing files and
                            refreshing the entries instead
                        </li>
                        <li>Seanime will not unmatch files that you confirm manually when refreshing entries</li>
                        <li>Seanime will not scan files marked as ignored when you refresh entries</li>
                        <li>Renaming or moving the files later on will no longer keep them locked/ignored</li>
                    </ul>

                    <div className={"flex gap-2"}>
                        <Button intent={"success"} onClick={handleConfirm} isDisabled={isLoading}>Confirm</Button>
                        <Button intent={"alert-link"} onClick={handleIgnore} isDisabled={isLoading}>
                            Mark files as ignored
                        </Button>
                    </div>
                </div>
                <div>
                    <h5>Help</h5>
                    <ul className={"list-disc pl-6"}>
                        <li>This feature allows you to match files to specific anime.
                            You should use it as the LAST resort OR use it to match ED/OP/NC/Specials folders to an
                            anime.
                        </li>
                        <li>See guide for more information</li>
                    </ul>
                </div>
            </div>}
        </Drawer>
    )

}
