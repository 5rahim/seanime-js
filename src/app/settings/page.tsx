"use client"

import { useCurrentUser } from "@/atoms/user"
import { settingsSchema, useSettings } from "@/atoms/settings"
import { toast } from "react-hot-toast"
import React, { useState } from "react"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { Field, TypesafeForm } from "@/components/ui/typesafe-form"


export default function Page() {

    const { user } = useCurrentUser()

    const { settings, updateSettings } = useSettings()

    const [selectedDir, setSelectedDir] = useState<string | undefined>(settings.library.localDirectory)


    return (
        <AppLayoutStack spacing={"sm"}>
            <p className={"font-semibold"}>Local library directory</p>
            <TypesafeForm
                schema={settingsSchema.shape.library}
                onSubmit={data => {
                    updateSettings("library", {
                        ...data,
                    })
                    toast.success("Settings changed")
                }}
                defaultValues={settings.library}
            >
                <Field.Text
                    // label={"Local directory"}
                    help={"Where your anime files are located/will be downloaded."}
                    name={"localDirectory"}
                />
                <Field.Submit role={"save"}/>
            </TypesafeForm>
        </AppLayoutStack>
    )
}
