import Image from "next/image"
import React from "react"
import { usePathname } from "next/navigation"

type Props = {}

export function DynamicHeaderBackground(props: Props) {

    const pathname = usePathname()


    return (
        <>
            {!pathname.startsWith("/view") && <>
                {!pathname.startsWith("/anilist") && <Image
                    src={"/landscape-beach.jpg"}
                    alt={"tenki no ko"}
                    fill
                    priority
                    className={"object-cover object-top"}
                />}
                {pathname.startsWith("/anilist") && <Image
                    src={"/landscape-tenki-no-ko.jpg"}
                    alt={"tenki no ko"}
                    fill
                    priority
                    className={"object-cover"}
                />}
                <div
                    className={"w-full absolute bottom-0 h-[20rem] bg-gradient-to-t from-[--background-color] to-transparent"}
                />
            </>}
        </>
    )
}
