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
                stackClassName={"space-y-5"}
            >
                {(f) => (
                    <>
                        <Field.Combobox
                            label={"Default Video Player"}
                            name={"defaultPlayer"}
                            options={[
                                { value: "mpc-hc", label: "MPC-HC" },
                                { value: "vlc", label: "VLC" },
                            ]}
                        />

                        <Field.Switch
                            name={"pauseAfterOpening"}
                            label={"No auto-play"}
                        />

                        <Divider/>

                        <div className={"flex gap-2"}>
                            <Field.Text
                                label={"MPC-HC Player"}
                                name={"mpc-hc"}
                            />

                            <Field.Text
                                label={"VLC Player"}
                                name={"vlc"}
                            />
                        </div>

                        <Divider/>

                        <Field.Text
                            label={"Video Player Web Client Host"}
                            name={"host"}
                        />

                        <Divider/>

                        <h4>VLC</h4>

                        <div className={"gap-2 flex flex-col lg:flex-row"}>
                            <Field.Number
                                label={"Port"}
                                name={"vlcPort"}
                                leftAddon={f.watch("host") + ":"}
                                discrete
                            />
                            <Field.Text
                                label={"Username"}
                                name={"vlcUsername"}
                            />
                            <Field.Text
                                label={"Password"}
                                name={"vlcPassword"}
                            />
                        </div>

                        <Divider/>

                        <h4>MPC-HC</h4>

                        <div className={"gap-2 flex flex-col lg:flex-row"}>
                            <Field.Number
                                label={"Port"}
                                name={"mpcPort"}
                                leftAddon={f.watch("host") + ":"}
                                discrete
                            />
                        </div>


                        <Field.Submit role={"save"}/>
                    </>
                )}
            </TypesafeForm>
        </div>
    )
}
