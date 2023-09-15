"use client"

import { useCurrentUser } from "@/atoms/user"
import { settingsSchema, useSettings } from "@/atoms/settings"
import { Field, TypesafeForm } from "@/components/ui/typesafe-form"
import { Divider } from "@/components/ui/divider"
import { toast } from "react-hot-toast"
import { FcVlc } from "@react-icons/all-files/fc/FcVlc"
import { FcVideoFile } from "@react-icons/all-files/fc/FcVideoFile"

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
                        <Field.Select
                            label={"Default Video Player"}
                            name={"defaultPlayer"}
                            options={[
                                { value: "mpc-hc", label: "MPC-HC" },
                                { value: "vlc", label: "VLC" },
                            ]}
                        />

                        {/*<Field.Switch*/}
                        {/*    name={"pauseAfterOpening"}*/}
                        {/*    label={"Disable auto-play"}*/}
                        {/*/>*/}

                        <Divider/>

                        <Field.Text
                            label={"Video Player Web Client Host"}
                            name={"host"}
                            help={"Default is 127.0.0.1"}
                        />

                        <Divider/>

                        <h4 className={"flex gap-2 items-center"}><FcVlc/> VLC</h4>

                        <Field.Text
                            label={"VLC Player"}
                            name={"vlc"}
                        />

                        <div className={"gap-2 flex flex-col lg:flex-row"}>
                            <Field.Number
                                label={"Port"}
                                name={"vlcPort"}
                                leftAddon={"http://" + f.watch("host") + ":"}
                                discrete
                            />
                            <Field.Text
                                label={"Username"}
                                name={"vlcUsername"}
                            />
                            <Field.Text
                                label={"Password"}
                                name={"vlcPassword"}
                                type={"password"}
                            />
                        </div>

                        <Divider/>

                        <h4 className={"flex gap-2 items-center"}><FcVideoFile/> MPC-HC</h4>

                        <Field.Text
                            label={"MPC-HC Player"}
                            name={"mpc-hc"}
                        />

                        <div className={"gap-2 flex flex-col lg:flex-row"}>
                            <Field.Number
                                label={"Port"}
                                name={"mpcPort"}
                                leftAddon={"http://" + f.watch("host") + ":"}
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
