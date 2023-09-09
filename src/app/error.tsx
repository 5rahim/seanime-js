"use client"

import React, { useEffect } from "react"
import { LuffyError } from "@/components/shared/luffy-error"

export default function Error({ error, reset }: any) {

    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div>
            <LuffyError reset={reset}>
                <span>Something went wrong!</span>
            </LuffyError>
        </div>
    )
}
