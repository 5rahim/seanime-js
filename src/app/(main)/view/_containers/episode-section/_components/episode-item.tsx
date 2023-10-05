import React, { startTransition, useMemo } from "react"
import { atom, PrimitiveAtom } from "jotai"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { useFocusSetAtom, useSelectAtom } from "@/atoms/helpers"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { IconButton } from "@/components/ui/button"
import { BiDotsHorizontal } from "@react-icons/all-files/bi/BiDotsHorizontal"
import { VscVerified } from "@react-icons/all-files/vsc/VscVerified"
import { BiLockOpenAlt } from "@react-icons/all-files/bi/BiLockOpenAlt"
import { EpisodeListItem } from "@/components/shared/episode-list-item"
import { AnifyAnimeEpisode } from "@/lib/anify/types"
import { Modal } from "@/components/ui/modal"
import { createIsolation } from "jotai-scope"
import { createTypesafeFormSchema, Field, TypesafeForm } from "@/components/ui/typesafe-form"
import toast from "react-hot-toast"
import {
    __useRerenderLocalFiles,
    useLibraryEntryDynamicDetails,
    useSpecialEpisodeIncludedInLibrary,
} from "@/atoms/library/local-file.atoms"
import { LocalFile } from "@/lib/local-library/types"
import {
    localFile_episodeExists,
    localFile_getDisplayTitle,
    localFile_getEpisodeCover,
    localFile_isMain,
} from "@/lib/local-library/utils/episode.utils"
import { anizip_getEpisodeFromMetadata } from "@/lib/anizip/utils"
import { AniZipData } from "@/lib/anizip/types"
import { anify_getEpisodeCover } from "@/lib/anify/utils"

const { Provider: ScopedProvider, useAtom: useScopedAtom } = createIsolation()

const __metadataModalIsOpenAtom = atom(false)

export const EpisodeItem = React.memo((props: {
    fileAtom: PrimitiveAtom<LocalFile>,
    aniZipData?: AniZipData,
    onPlayFile: (path: string) => void
    media: AnilistDetailedMedia
    anifyEpisodeData?: AnifyAnimeEpisode[]
}) => {

    const { fileAtom, aniZipData, onPlayFile, media, anifyEpisodeData } = props

    const mediaID = useSelectAtom(fileAtom, file => file.mediaId) // Listen to changes in order to unmount when we unmatch
    const metadata = useSelectAtom(fileAtom, file => file.metadata)
    const parsedInfo = useSelectAtom(fileAtom, file => file.parsedInfo)
    const path = useSelectAtom(fileAtom, file => file.path)
    const setFileLocked = useFocusSetAtom(fileAtom, "locked")
    const setFileMediaId = useFocusSetAtom(fileAtom, "mediaId")

    const { episodeProgress, progress } = useLibraryEntryDynamicDetails(media.id)

    const specialIsIncluded = useSpecialEpisodeIncludedInLibrary(media?.id)

    const aniZipEpisode = anizip_getEpisodeFromMetadata(aniZipData, { metadata })
    const anifyEpisodeCover = anify_getEpisodeCover(anifyEpisodeData, metadata.episode)
    const fileTitle = useMemo(() => parsedInfo?.original?.replace(/.(mkv|mp4)/, "")?.replaceAll(/(\[)[a-zA-Z0-9 ._~-]+(\])/ig, "")?.replaceAll(/[_,-]/g, " "), [parsedInfo])

    const image = useMemo(() => {
        return localFile_getEpisodeCover({ metadata }, aniZipEpisode?.image, anifyEpisodeCover, media?.coverImage?.medium)
    }, [metadata, anifyEpisodeCover, aniZipEpisode?.image])

    const isWatched = useMemo(() => {
        if (!localFile_isMain({ metadata }) || !localFile_episodeExists({ metadata })) return false
        // [EPISODE-ZERO-SUPPORT]
        return episodeProgress >= metadata.episode!
    }, [episodeProgress, metadata])

    const displayedTitle = useMemo(() => {
        return localFile_getDisplayTitle({ metadata, parsedInfo }, media)
    }, [parsedInfo, metadata])

    if (mediaID !== media.id) return null

    return (
        <ScopedProvider>
            <EpisodeListItem
                media={media}
                image={image}
                onClick={async () => onPlayFile(path)}
                title={displayedTitle}
                showImagePlaceholder={!metadata.isNC}
                episodeTitle={aniZipEpisode?.title?.en}
                fileName={fileTitle}
                isWatched={isWatched}
                action={<>
                    <EpisodeItemLockButton fileAtom={fileAtom}/>

                    <DropdownMenu trigger={
                        <IconButton
                            icon={<BiDotsHorizontal/>}
                            intent={"gray-basic"}
                            size={"xs"}
                        />
                    }>
                        <DropdownMenu.Item
                            onClick={() => {
                                startTransition(() => {
                                    setFileMediaId(null)
                                    setFileLocked(false)
                                })
                            }}
                        >Unmatch</DropdownMenu.Item>
                        <MetadataModalButton/>
                    </DropdownMenu>
                </>}
            />
            <MetadataModal
                title={displayedTitle}
                metadata={metadata}
                fileAtom={fileAtom}
            />
        </ScopedProvider>
    )
})

type MetadataModalProps = {
    title: string,
    metadata: LocalFile["metadata"]
    fileAtom: PrimitiveAtom<LocalFile>
}

const metadataSchema = createTypesafeFormSchema(({ z }) => z.object({
    episode: z.number().min(0),
    aniDBEpisodeNumber: z.string().transform(value => value.length > 0 ? value.toUpperCase() : undefined),
    isVersion: z.boolean().optional().transform(value => !!value ? value : undefined),
    isSpecial: z.boolean().optional().transform(value => !!value ? value : undefined),
    isNC: z.boolean().optional().transform(value => !!value ? value : undefined),
    mediaId: z.string(),
}))

export function MetadataModal({ title, metadata, fileAtom }: MetadataModalProps) {

    const [isOpen, setIsOpen] = useScopedAtom(__metadataModalIsOpenAtom)
    const setFileMetadata = useFocusSetAtom(fileAtom, "metadata")
    const mediaId = useSelectAtom(fileAtom, file => file.mediaId)
    const rerenderFiles = __useRerenderLocalFiles()
    // const anilistUserMedia = useAnilistUserMediaAndSimilarById(mediaId)

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            isClosable
            title={title}
            titleClassName={"text-center"}
            size={"lg"}
        >
            <TypesafeForm
                schema={metadataSchema}
                onSubmit={({ mediaId, ...data }) => {
                    const aniDBEpisodeNumber = !data.isSpecial
                        ? data.aniDBEpisodeNumber?.replace("S", "")
                        : (
                            !!data.aniDBEpisodeNumber && !data.aniDBEpisodeNumber?.startsWith("S")
                                ? "S" + data.aniDBEpisodeNumber
                                : data.aniDBEpisodeNumber
                        )
                    setFileMetadata({
                        ...data,
                        // aniDBEpisodeNumber: data.isSpecial !== metadata.isSpecial ? aniDBEpisodeNumber : metadata.aniDBEpisodeNumber,
                    })
                    setIsOpen(false)
                    startTransition(() => {
                        toast.success("Metadata saved")
                        rerenderFiles()
                    })
                }}
                onError={console.log}
                //@ts-ignore
                defaultValues={{ ...metadata, mediaId: String(mediaId) }}
            >
                <Field.Number label={"Episode number"} name={"episode"}
                              help={"Relative episode number. If movie, episode number = 1"} discrete isRequired/>
                <Field.Text
                    label={"AniDB episode number"}
                    name={"aniDBEpisodeNumber"}
                    help={"Specials typically contain the letter S"}
                />
                <Field.Switch label={"Special/OVA"} name={"isSpecial"}/>
                <Field.Switch label={"NC (OP/ED)"} name={"isNC"}/>
                <Field.Switch label={"Versioned"} name={"isVersion"} isDisabled/>
                {/*<Field.Combobox*/}
                {/*    label={"AniList ID"}*/}
                {/*    name={"mediaId"}*/}
                {/*    returnValueOrLabel={"value"}*/}
                {/*    allowCustomValue={false}*/}
                {/*    options={anilistUserMedia.filter(media => !!media.title?.userPreferred || !!media.title?.english).map(media => ({*/}
                {/*        label: (media.title!.userPreferred || media.title!.english!)!,*/}
                {/*        value: String(media.id)!*/}
                {/*    }))}*/}
                {/*/>*/}
                <div className={"w-full flex justify-end"}>
                    <Field.Submit role={"save"} intent={"success"}/>
                </div>
            </TypesafeForm>
        </Modal>
    )
}

export function MetadataModalButton() {
    const [, setIsOpen] = useScopedAtom(__metadataModalIsOpenAtom)
    return <DropdownMenu.Item onClick={() => setIsOpen(true)}>Update metadata</DropdownMenu.Item>
}

const EpisodeItemLockButton = (props: { fileAtom: PrimitiveAtom<LocalFile> }) => {
    const locked = useSelectAtom(props.fileAtom, file => file.locked)
    const setFileLocked = useFocusSetAtom(props.fileAtom, "locked")

    return (
        <>
            <IconButton
                icon={locked ? <VscVerified/> : <BiLockOpenAlt/>}
                intent={locked ? "success-basic" : "warning-basic"}
                size={"md"}
                className={"hover:opacity-60"}
                onClick={() => setFileLocked(prev => !prev)}
            />
        </>
    )
}
