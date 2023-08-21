import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function loading() {
    return (
        <>
            <div className={"__header h-[30rem]"}>
                <div
                    className="h-[30rem] w-[calc(100%-5rem)] flex-none object-cover object-center absolute top-0 overflow-hidden">
                    <div
                        className={"w-full absolute z-[1] top-0 h-[15rem] bg-gradient-to-b from-[--background-color] to-transparent via"}/>
                    <Skeleton className={"h-full absolute w-full"}/>
                    <div
                        className={"w-full absolute bottom-0 h-[20rem] bg-gradient-to-t from-[--background-color] via-transparent to-transparent"}/>
                </div>
            </div>
        </>
    )
}
