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
                schema={settingsSchema.shape.anilist}
                onSubmit={data => {
                    updateSettings("anilist", {
                        ...data,
                    })
                    toast.success("Settings changed")
                }}
                defaultValues={settings.anilist}
            >
                <Field.Switch
                    label={"Show audience score"}
                    name={"showAudienceScore"}
                />
                <Field.Submit role={"save"}/>
            </TypesafeForm>
        </AppLayoutStack>
    )
}
