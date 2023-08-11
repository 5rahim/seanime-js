"use client"

import { useCurrentUser } from "@/atoms/user"
import { settingsSchema, useSettings } from "@/atoms/settings"
import { Field, TypesafeForm } from "@/components/ui/typesafe-form"

export default function Page() {

    const { user } = useCurrentUser()

    const { settings, updateSettings } = useSettings()
    return (
        <div>
            <TypesafeForm
                schema={settingsSchema.shape.library}
                onSubmit={data => {
                    updateSettings("library", {
                        ...data,
                    })
                }}
                defaultValues={settings.library}
            >
                <Field.Text
                    label={"Local directory"}
                    help={"Where your anime files are located/will be downloaded."}
                    name={"localDirectory"}
                />
                <Field.Submit role={"save"}/>
            </TypesafeForm>
        </div>
    )
}
