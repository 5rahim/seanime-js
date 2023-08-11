"use client"

import React from "react"
import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: any) {

    return (
        <div>
            <p>Oops!</p>
            <Button onClick={reset}>Retry</Button>
        </div>
    )
}
