"use client"
import React, { useEffect } from "react"
import { Command } from "@tauri-apps/api/shell"
import { useAuthed } from "@/atoms/auth"
import { useAtomValue } from "jotai/react"
import { userAtom } from "@/atoms/user"

const test = new Command("node")


interface ButtonProps {
    children?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = (props) => {

    const { children, ...rest } = props

    const { token } = useAuthed()

    const user = useAtomValue(userAtom)

    useEffect(() => {
        console.log(user)
    }, [user])

    // const { data } = useAniListClientQuery(ViewerDocument, undefined, { enabled: !!token })

    return (
        <>
            <p>{user?.name}</p>
            <button
                onClick={async () => {
                    // await openSomething()
                }}
            >
                Like
            </button>
        </>
    )

}
