"use client"
import React from "react"
import { IconButton } from "@/components/ui/button"
import { AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { useAnilistCollectionEntryAtomByMediaId, useUpdateAnilistEntry } from "@/atoms/anilist/entries.atoms"
import { BiPlus } from "@react-icons/all-files/bi/BiPlus"
import { useToggle } from "react-use"
import { Modal } from "@/components/ui/modal"
import { createTypesafeFormSchema, Field, TypesafeForm } from "@/components/ui/typesafe-form"
import { MediaListStatus } from "@/gql/graphql"
import { useSelectAtom } from "@/atoms/helpers"
import { BiStar } from "@react-icons/all-files/bi/BiStar"
import { BiListPlus } from "@react-icons/all-files/bi/BiListPlus"
import { AiFillEdit } from "@react-icons/all-files/ai/AiFillEdit"

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
    const state = !!collectionEntryAtom ? useSelectAtom(collectionEntryAtom, entry => entry) : undefined

    const { updateEntry } = useUpdateAnilistEntry()

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

            {/*TODO: Add to watching button*/}

            <Modal isOpen={open} onClose={toggle} title={media.title?.userPreferred ?? undefined} isClosable
                   size={"xl"}>

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
                                { value: "CURRENT", label: "Watching" },
                                { value: "PLANNING", label: "Planning" },
                                { value: "PAUSED", label: "Paused" },
                                { value: "COMPLETED", label: "Completed" },
                                { value: "DROPPED", label: "Dropped" },
                            ]}
                        />
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
                    </div>
                    <div className={"flex flex-col sm:flex-row gap-4"}>
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
                    </div>
                    <Field.Submit role={"save"}/>
                </TypesafeForm>}

            </Modal>
        </>
    )

}
