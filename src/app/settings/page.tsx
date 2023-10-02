"use client"

import { settingsSchema, useSettings } from "@/atoms/settings"
import { toast } from "react-hot-toast"
import React from "react"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { Field, TypesafeForm } from "@/components/ui/typesafe-form"


export default function Page() {

    const { settings, updateSettings } = useSettings()

    return (
        <AppLayoutStack spacing={"sm"}>
            {/*<p className={"font-semibold"}>Local library directory</p>*/}
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
                <Field.Directory
                    label={"Local directory"}
                    help={"Where your anime files are located/will be downloaded."}
                    name={"localDirectory"}
                    directoryShouldExist={true}
                    showFolderOptions={false}
                />
                <Field.Submit role={"save"}/>
            </TypesafeForm>
        </AppLayoutStack>
    )
}
