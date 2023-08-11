"use client"

import Link from "next/link"
import { Button } from "@/app/button"
import React from "react"
import { useAuthed } from "@/atoms/auth"
import Image from "next/image"

export default function Home() {

    const { isAuthed } = useAuthed()

    if (!isAuthed) return (
        <main>
            <div className={"w-full h-[25rem] relative overflow-hidden"}>
                <Image
                    src={"/landscape-beach.jpg"}
                    alt={"tenki no ko"}
                    fill
                    className={"object-cover"}
                />
                <div
                    className={"w-full absolute bottom-0 h-[20rem] bg-gradient-to-t via-[--background-color] via-10% from-[--background-color] to-transparent"}/>
            </div>
        </main>
    )

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
                <Link href={"/folders"}
                      className="">
                    Get started by editing&nbsp;
                    <code className="font-mono font-bold">src/app/page.tsx</code>
                </Link>
                <Button/>
            </div>
        </main>
    )
}
