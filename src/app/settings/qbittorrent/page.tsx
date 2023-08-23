"use client"

import { settingsSchema, useSettings } from "@/atoms/settings"
import { Field, TypesafeForm } from "@/components/ui/typesafe-form"
import { toast } from "react-hot-toast"

export default function Page() {

    const { settings, updateSettings } = useSettings()
    return (
        <div>
            <TypesafeForm
                schema={settingsSchema.shape.qbittorrent}
                onSubmit={data => {
                    updateSettings("qbittorrent", {
                        ...data,
                    })
                    toast.success("Settings changed")
                }}
                defaultValues={settings.qbittorrent}
                onError={console.log}
                stackClassName={"space-y-5"}
            >
                {(f) => (
                    <>
                        <div className={"gap-2 flex flex-col lg:flex-row"}>
                            <Field.Text
                                label={"Host"}
                                name={"host"}
                                placeholder={"127.0.0.1"}
                            />
                            <Field.Number
                                label={"Port"}
                                name={"port"}
                                discrete
                            />
                            <Field.Text
                                label={"Username"}
                                name={"username"}
                                placeholder={"admin"}
                            />
                            <Field.Text
                                label={"Password"}
                                name={"password"}
                                type={"password"}
                            />
                        </div>

                        <Field.Submit role={"save"}/>
                    </>
                )}
            </TypesafeForm>
        </div>
    )
}
