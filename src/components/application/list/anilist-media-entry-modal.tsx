"use client"
import React, { Fragment } from "react"
import { Button, IconButton } from "@/components/ui/button"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { useAnilistCollectionEntryAtomByMediaId, useUpdateAnilistEntry } from "@/atoms/anilist/entries.atoms"
import { BiPlus } from "@react-icons/all-files/bi/BiPlus"
import { useToggle } from "react-use"
import { Modal } from "@/components/ui/modal"
import { createTypesafeFormSchema, Field, TypesafeForm } from "@/components/ui/typesafe-form"
import { MediaListStatus } from "@/gql/graphql"
import { useStableSelectAtom } from "@/atoms/helpers"
import { BiStar } from "@react-icons/all-files/bi/BiStar"
import { BiListPlus } from "@react-icons/all-files/bi/BiListPlus"
import { AiFillEdit } from "@react-icons/all-files/ai/AiFillEdit"
import Image from "next/image"
import { cn } from "@/components/ui/core"
import { BiTrash } from "@react-icons/all-files/bi/BiTrash"
import { Disclosure } from "@headlessui/react"

interface AnilistMediaEntryModalProps {
    children?: React.ReactNode
    media: AnilistShowcaseMedia
}

const entrySchema = createTypesafeFormSchema(({ z, presets }) => z.object({
    status: z.custom<MediaListStatus>().nullish(),
    score: z.number().min(0).max(1000).nullish(),
    progress: z.number().min(0).nullish(),
    startDate: presets.datePicker.nullish().transform(value => value ? ({
        day: value.getUTCDay(),
        month: value.getUTCMonth() + 1,
        year: value.getUTCFullYear(),
    }) : undefined),
    endDate: presets.datePicker.nullish().transform(value => value ? ({
        day: value.getUTCDay(),
        month: value.getUTCMonth() + 1,
        year: value.getUTCFullYear(),
    }) : undefined),
}))


export const AnilistMediaEntryModal: React.FC<AnilistMediaEntryModalProps> = (props) => {

    const { children, media, ...rest } = props

    const collectionEntryAtom = useAnilistCollectionEntryAtomByMediaId(media.id)
    const state = useStableSelectAtom(collectionEntryAtom, entry => entry)

    const { updateEntry, deleteEntry } = useUpdateAnilistEntry()

    const [open, toggle] = useToggle(false)

    return (
        <>
            {!!collectionEntryAtom && <IconButton
                intent={"gray-subtle"}
                icon={!!collectionEntryAtom ? <AiFillEdit/> : <BiPlus/>}
                rounded
                size={"sm"}
                onClick={toggle}
            />}

            {!collectionEntryAtom && <IconButton
                intent={"primary-subtle"}
                icon={<BiPlus/>}
                rounded
                size={"md"}
                onClick={() => updateEntry({
                    mediaId: media.id,
                    status: "PLANNING",
                })}
            />}

            {/*{!!collectionEntryAtom && state?.status === "PLANNING" && state.id && <IconButton*/}
            {/*    intent={"alert-subtle"}*/}
            {/*    icon={<BiTrash />}*/}
            {/*    rounded*/}
            {/*    size={"sm"}*/}
            {/*    onClick={() => deleteEntry({*/}
            {/*        mediaListEntryId: state.id,*/}
            {/*        status: "PLANNING",*/}
            {/*    })}*/}
            {/*/>}*/}

            <Modal
                isOpen={open}
                onClose={toggle}
                title={media.title?.userPreferred ?? undefined}
                isClosable
                size={"xl"}
                titleClassName={"text-xl"}
            >

                {media.bannerImage && <div
                    className="h-24 w-full flex-none object-cover object-center overflow-hidden absolute left-0 top-0 z-[-1]">
                    <Image
                        src={media.bannerImage!}
                        alt={"banner"}
                        fill
                        quality={80}
                        priority
                        sizes="20rem"
                        className="object-cover object-center opacity-30"
                    />
                    <div
                        className={"z-[5] absolute bottom-0 w-full h-[80%] bg-gradient-to-t from-gray-900 to-transparent"}
                    />
                </div>}

                {(!!collectionEntryAtom && !!state) && <TypesafeForm
                    schema={entrySchema}
                    onSubmit={data => {
                        updateEntry({
                            mediaId: media.id,
                            status: data.status,
                            score: data.score,
                            progress: data.progress,
                            startedAt: data.startDate,
                            completedAt: data.endDate,
                        })
                    }}
                    className={cn(
                        {
                            "mt-16": !!media.bannerImage,
                        },
                    )}
                    onError={console.log}
                    defaultValues={{
                        status: state.status,
                        score: state.score,
                        progress: state.progress,
                        //@ts-ignore
                        startDate: (state.startedAt && state.startedAt.year) ? new Date(state.startedAt.year, (state.startedAt.month || 1) - 1, state.startedAt.day || 1) : undefined,
                        //@ts-ignore
                        endDate: (state.completedAt && state.completedAt.year) ? new Date(state.completedAt.year, (state.completedAt.month || 1) - 1, state.completedAt.day || 1) : undefined,
                    }}
                >
                    <div className={"flex flex-col sm:flex-row gap-4"}>
                        <Field.Select
                            label={"Status"}
                            name={"status"}
                            options={[
                                media.status !== "NOT_YET_RELEASED" ? {
                                    value: "CURRENT",
                                    label: "Watching",
                                } : undefined,
                                { value: "PLANNING", label: "Planning" },
                                media.status !== "NOT_YET_RELEASED" ? { value: "PAUSED", label: "Paused" } : undefined,
                                media.status !== "NOT_YET_RELEASED" ? {
                                    value: "COMPLETED",
                                    label: "Completed",
                                } : undefined,
                                media.status !== "NOT_YET_RELEASED" ? {
                                    value: "DROPPED",
                                    label: "Dropped",
                                } : undefined,
                            ].filter(Boolean)}
                        />
                        {media.status !== "NOT_YET_RELEASED" && <>
                            <Field.Number
                                label={"Score"}
                                name={"score"}
                                discrete
                                min={0}
                                max={10}
                                maxFractionDigits={0}
                                minFractionDigits={0}
                                precision={1}
                                rightIcon={<BiStar/>}
                            />
                            <Field.Number
                                label={"Progress"}
                                name={"progress"}
                                discrete
                                min={0}
                                max={(media.nextAiringEpisode?.episode ? media.nextAiringEpisode?.episode - 1 : undefined) || media.episodes || 0}
                                maxFractionDigits={0}
                                minFractionDigits={0}
                                precision={1}
                                rightIcon={<BiListPlus/>}
                            />
                        </>}
                    </div>
                    {media.status !== "NOT_YET_RELEASED" && <div className={"flex flex-col sm:flex-row gap-4"}>
                        <Field.DatePicker
                            label={"Start date"}
                            name={"startDate"}
                            // defaultValue={(state.startedAt && state.startedAt.year) ? parseAbsoluteToLocal(new Date(state.startedAt.year, (state.startedAt.month || 1)-1, state.startedAt.day || 1).toISOString()) : undefined}
                        />
                        <Field.DatePicker
                            label={"End date"}
                            name={"endDate"}
                            // defaultValue={(state.completedAt && state.completedAt.year) ? parseAbsoluteToLocal(new Date(state.completedAt.year, (state.completedAt.month || 1)-1, state.completedAt.day || 1).toISOString()) : undefined}
                        />
                    </div>}

                    <div className={"flex w-full items-center justify-between mt-4"}>
                        <div className={"flex items-center gap-1"}>
                            <Disclosure>
                                <Disclosure.Button as={Fragment}>
                                    <IconButton
                                        intent={"alert-subtle"}
                                        icon={<BiTrash/>}
                                        rounded
                                        size={"md"}
                                    />
                                </Disclosure.Button>
                                <Disclosure.Panel>
                                    <Button
                                        intent={"alert-basic"}
                                        rounded
                                        size={"md"}
                                        onClick={() => deleteEntry({
                                            mediaListEntryId: state.id,
                                            status: state.status!,
                                        })}
                                    >Confirm</Button>
                                </Disclosure.Panel>
                            </Disclosure>
                        </div>

                        <Field.Submit role={"save"}/>
                    </div>
                </TypesafeForm>}

            </Modal>
        </>
    )

}
