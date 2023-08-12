"use client"

import { useCurrentUser } from "@/atoms/user"
import { settingsSchema, useSettings } from "@/atoms/settings"
import { Field, TypesafeForm } from "@/components/ui/typesafe-form"
import { Divider } from "@/components/ui/divider"
import { toast } from "react-hot-toast"

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
                    toast.success("Settings changed")
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
                <Divider/>

                <Field.Text
                    label={"MPC-HC Player"}
                    name={"mpc-hc"}
                />

                <Field.Text
                    label={"VLC Player"}
                    name={"vlc"}
                />

                <Field.Submit role={"save"}/>
            </TypesafeForm>
        </div>
    )
}
