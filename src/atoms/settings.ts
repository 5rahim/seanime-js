/* -------------------------------------------------------------------------------------------------
 * Schema
 * -----------------------------------------------------------------------------------------------*/

import { createTypesafeFormSchema, InferType } from "@/components/ui/typesafe-form"
import { atomWithStorage } from "jotai/utils"
import { focusAtom } from "jotai-optics"
import { useImmerAtom } from "jotai-immer"
import { useCallback } from "react"
import { directoryExists } from "@/lib/local-directory/utils"
// import { exists } from "@tauri-apps/api/fs"

export const settingsSchema = createTypesafeFormSchema(({ z }) => z.object({
    library: z.object({
        localDirectory: z.string().nullable().refine(async (value) => {
            if (value) {
                return await directoryExists(value)
            }
            return false
        }, { message: "Directory does not exist" }),
    }),
    player: z.object({
        defaultPlayer: z.enum(["mpc-hc", "vlc"]),
        "mpc-hc": z.string(),
        "vlc": z.string(),
        audioLng: z.string(),
        subtitleLng: z.string(),
    }),
}))

export type Settings = InferType<typeof settingsSchema>

export const initialSettings: Settings = {
    library: {
        localDirectory: null,
    },
    player: {
        defaultPlayer: "mpc-hc",
        "mpc-hc": "C:\\Program Files\\MPC-HC\\mpc-hc64.exe",
        vlc: "C:\\Program Files\\VideoLAN\\VLC",
        audioLng: "jpn",
        subtitleLng: "eng",
    },
}

/* -------------------------------------------------------------------------------------------------
 * Atoms
 * -----------------------------------------------------------------------------------------------*/

export const settingsAtoms = atomWithStorage<Settings>("sea-settings", initialSettings)

export const librarySettingsAtom = focusAtom(settingsAtoms, optic => optic.prop("library"))

/* -------------------------------------------------------------------------------------------------
 * Hooks
 * -----------------------------------------------------------------------------------------------*/

export function useSettings() {

    const [settings, setSettings] = useImmerAtom(settingsAtoms)

    // const setting =

    return {
        settings,
        updateSettings: useCallback(<K extends keyof Settings>(key: K, value: Partial<Settings[K]>) => {
            setSettings(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    ...value,
                },
            }))
        }, []),
    }

}
