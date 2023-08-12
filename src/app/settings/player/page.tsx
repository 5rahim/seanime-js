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
                schema={settingsSchema.shape.player}
                onSubmit={data => {
                    updateSettings("player", {
                        ...data,
                    })
                }}
                defaultValues={settings.player}
            >
                <Field.Combobox
                    label={"Default video player"}
                    name={"defaultPlayer"}
                    options={[
                        { value: "mpc-hc", label: "MPC-HC" },
                        { value: "vlc", label: "VLC" },
                    ]}
                />
                <Field.Submit role={"save"}/>
            </TypesafeForm>
        </div>
    )
}
