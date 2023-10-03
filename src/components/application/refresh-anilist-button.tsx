"use client"
import React from "react"
import { Button } from "@/components/ui/button"
import { IoReload } from "@react-icons/all-files/io5/IoReload"
import { useAuthed } from "@/atoms/auth"
import { useRefreshAnilistCollection } from "@/atoms/anilist/collection.atoms"

interface RefreshAnilistButtonProps {
    children?: React.ReactNode
}

export const RefreshAnilistButton: React.FC<RefreshAnilistButtonProps> = (props) => {

    const { children, ...rest } = props

    const { isAuthed } = useAuthed()
    const refetchCollection = useRefreshAnilistCollection()

    return (
        <>
            {isAuthed && <Button
                onClick={() => refetchCollection()}
                intent={"warning-subtle"}
                rightIcon={<IoReload/>}
                leftIcon={<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="24" height="24"
                               viewBox="0 0 24 24" role="img">
                    <path
                        d="M6.361 2.943 0 21.056h4.942l1.077-3.133H11.4l1.052 3.133H22.9c.71 0 1.1-.392 1.1-1.101V17.53c0-.71-.39-1.101-1.1-1.101h-6.483V4.045c0-.71-.392-1.102-1.101-1.102h-2.422c-.71 0-1.101.392-1.101 1.102v1.064l-.758-2.166zm2.324 5.948 1.688 5.018H7.144z"/>
                </svg>}
                className={"hover:bg-transparent dark:hover:bg-transparent"}
            >
                Refresh AniList
            </Button>}
        </>
    )

}
