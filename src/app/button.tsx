'use client'
import React from 'react'

interface ButtonProps {
    children?: React.ReactNode
    action: () => Promise<void>
}

export const Button: React.FC<ButtonProps> = (props) => {

    const { children, action, ...rest } = props

    return (
        <>
            <button
                onClick={async () => {
                    await action()
                }}
            >
                Like
            </button>
        </>
    )

}
