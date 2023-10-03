import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import React from "react"
import { cn } from "@/components/ui/core"
import Image from "next/image"
import { imageShimmer } from "@/components/shared/image-helpers"

interface EpisodeListItemProps {
    media: AnilistDetailedMedia,
    children?: React.ReactNode
    action?: React.ReactNode
    image?: string | null
    onClick?: () => void
    title: string,
    episodeTitle?: string | null
    description?: string | null
    fileName?: string
    showImagePlaceholder?: boolean
    isSelected?: boolean
    isWatched?: boolean
    unoptimizedImage?: boolean
}

export const EpisodeListItem: React.FC<EpisodeListItemProps & React.ComponentPropsWithoutRef<"div">> = (props) => {

    const {
        children,
        action,
        image,
        onClick,
        episodeTitle,
        description,
        title,
        fileName,
        isSelected,
        media,
        showImagePlaceholder,
        isWatched,
        unoptimizedImage,
        ...rest
    } = props

    return <>
        <div
            className={cn(
                "border border-[--border] p-4 pr-12 rounded-lg relative transition hover:bg-gray-900 group/episode-list-item",
                {
                    "border-brand-200 bg-gray-800 hover:bg-gray-800": isSelected,
                    // "opacity-50": isWatched && !isSelected,
                },
            )}
            {...rest}
        >
            {/*{isCompleted && <div className={"absolute top-1 left-1 w-full h-1 bg-brand rounded-full"}/>}*/}

            <div
                className={cn(
                    "flex gap-4 relative",
                    {
                        "cursor-pointer": !!onClick,
                    },
                )}
                onClick={onClick}
            >
                {(image && !unoptimizedImage) && <div
                    className="h-24 w-24 flex-none rounded-md object-cover object-center relative overflow-hidden">
                    <Image
                        src={image}
                        alt={"episode image"}
                        fill
                        quality={60}
                        placeholder={imageShimmer(700, 475)}
                        sizes="10rem"
                        className={cn("object-cover object-center transition", {
                            "opacity-30 group-hover/episode-list-item:opacity-100": isWatched,
                        })}
                        data-src={image}
                    />
                </div>}
                {(image && unoptimizedImage) && <div
                    className="h-24 w-24 flex-none rounded-md object-cover object-center relative overflow-hidden">
                    <img
                        src={image}
                        alt={"episode image"}
                        className="object-cover object-center absolute w-full h-full"
                        data-src={image}
                    />
                </div>}

                {(showImagePlaceholder && !image) && (
                    <div className={"h-24 w-24 rounded-md flex-none bg-gray-800 relative overflow-hidden"}>
                        {props.media.coverImage?.medium && <Image
                            src={props.media.coverImage?.medium}
                            alt={"episode image"}
                            fill
                            quality={60}
                            priority
                            sizes="10rem"
                            className="object-cover object-center"
                        />}
                    </div>
                )}

                <div className={"relative overflow-hidden"}>
                    <h4 className={cn("font-medium transition", { "opacity-50 group-hover/episode-list-item:opacity-100": isWatched })}>{title}</h4>

                    {!!episodeTitle && <p className={cn("text-sm text-[--muted] line-clamp-2")}>{episodeTitle}</p>}

                    {!!fileName && <p className={"text-sm text-gray-600 truncate text-ellipsis"}>{fileName}</p>}
                    {!!description && <p className={"text-sm text-gray-500 line-clamp-2"}>{description}</p>}
                    {children && children}
                </div>
            </div>

            {action && <div className={"absolute right-1 top-1 flex flex-col items-center"}>
                {action}
            </div>}
        </div>
    </>

}
