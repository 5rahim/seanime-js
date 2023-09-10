"use client"

import { useCurrentUser } from "@/atoms/user"
import { useSettings, useUpdateSettings } from "@/atoms/settings"
import { toast } from "react-hot-toast"
import { useAsyncFn } from "react-use"
import { open } from "@tauri-apps/api/dialog"
import React, { useState } from "react"
import { FcOpenedFolder } from "@react-icons/all-files/fc/FcOpenedFolder"
import { Tooltip } from "@/components/ui/tooltip"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { Button } from "@/components/ui/button"

export default function Page() {

    const { user } = useCurrentUser()

    const { settings } = useSettings()
    const updateSettings = useUpdateSettings()

    const [selectedDir, setSelectedDir] = useState<string | undefined>(settings.library.localDirectory)

    const [state, selectDir] = useAsyncFn(async () => {
        const selected = await open({
            directory: true,
            multiple: false,
            defaultPath: selectedDir,
        })
        if (selected) {
            setSelectedDir((selected ?? undefined) as string | undefined)
            return selected
        }
    }, [selectedDir])

    return (
        <AppLayoutStack spacing={"sm"}>
            <p className={"font-semibold"}>Local library directory</p>
            <Tooltip trigger={<p
                className={"text-sm font-medium flex items-center gap-2 rounded-md border border-[--border] p-2 cursor-pointer"}
                onClick={async () => {
                    await selectDir()
                }}
            >
                <FcOpenedFolder className={"text-2xl"}/>
                {selectedDir}
            </p>}>
                Change directory
            </Tooltip>
            <Button
                isDisabled={selectedDir === settings.library.localDirectory}
                onClick={() => {
                    if (selectedDir) {
                        updateSettings(draft => {
                            draft.library.localDirectory = selectedDir
                            return
                        })
                        toast.success("Settings changed")
                    }
                }}
            >Save</Button>
            {/*<TypesafeForm*/}
            {/*    schema={settingsSchema.shape.library}*/}
            {/*    onSubmit={data => {*/}
            {/*        updateSettings("library", {*/}
            {/*            ...data,*/}
            {/*        })*/}
            {/*        toast.success("Settings changed")*/}
            {/*    }}*/}
            {/*    defaultValues={settings.library}*/}
            {/*>*/}
            {/*    <Field.Text*/}
            {/*        label={"Local directory"}*/}
            {/*        help={"Where your anime files are located/will be downloaded."}*/}
            {/*        name={"localDirectory"}*/}
            {/*    />*/}
            {/*    <Field.Submit role={"save"}/>*/}
            {/*</TypesafeForm>*/}
        </AppLayoutStack>
    )
}
