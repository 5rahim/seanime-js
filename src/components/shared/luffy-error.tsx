"use client"
import React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { useRouter } from "next/navigation"
import { cn } from "@/components/ui/core"

interface LuffyErrorProps {
    children?: React.ReactNode
    className?: string
    reset?: () => void
}

export const LuffyError: React.FC<LuffyErrorProps> = (props) => {

    const { children, reset, className, ...rest } = props

    const router = useRouter()


    return (
        <>
            <AppLayoutStack className={cn("w-full flex flex-col items-center mt-10", className)}>
                {<div
                    className="h-[10rem] w-[10rem] mx-auto flex-none rounded-md object-cover object-center relative overflow-hidden">
                    <Image
                        src={"/luffy-01.png"}
                        alt={""}
                        fill
                        quality={100}
                        priority
                        sizes="10rem"
                        className="object-contain object-top"
                    />
                </div>}
                <div className={"text-center space-y-4"}>
                    <h2>Oops!</h2>
                    <p>{children}</p>
                    <div>
                        {!reset ? (
                            <Button intent={"warning-subtle"} onClick={() => router.refresh()}>Retry</Button>
                        ) : (
                            <Button intent={"warning-subtle"} onClick={reset}>Retry</Button>
                        )}
                    </div>
                </div>
            </AppLayoutStack>
        </>
    )

}
