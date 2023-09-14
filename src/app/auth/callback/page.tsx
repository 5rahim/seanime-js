"use client"
import { LoadingOverlay } from "@/components/ui/loading-spinner"
import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAnilistLogin, useAuthed } from "@/atoms/auth"
import { useRefreshAnilistCollection } from "@/atoms/anilist/collection.atoms"
import toast from "react-hot-toast"

export default function Page() {

    const router = useRouter()
    const { isAuthed } = useAuthed()
    const { authenticate } = useAnilistLogin()
    const refreshCollection = useRefreshAnilistCollection()

    useEffect(() => {
        if (window !== undefined && !isAuthed) {
            const token = (window.location.hash.replace("#access_token=", "").replace(/&.*/, ""))

            if (token) {
                authenticate(token)
                const t = setTimeout(() => {
                    refreshCollection()
                    toast.success("Successfully authenticated")
                    router.push("/")
                }, 1000)

                return () => clearTimeout(t)
            } else {
                toast.error("An error occurred while authenticating with AniList")
                router.push("/")
            }

        } else {
            router.push("/")
        }
    }, [])

    return (
        <div>
            <LoadingOverlay className={"fixed w-full h-full z-[80]"}>
                <h3 className={"mt-2"}>Authenticating...</h3>
            </LoadingOverlay>
        </div>
    )

}
