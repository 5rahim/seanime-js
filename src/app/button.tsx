'use client'
import React from 'react'
import { Command } from "@tauri-apps/api/shell";

const test = new Command('node')


interface ButtonProps {
    children?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = (props) => {

    const { children, ...rest } = props

    return (
        <>
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
