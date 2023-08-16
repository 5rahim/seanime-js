/* -------------------------------------------------------------------------------------------------
 * Schema
 * -----------------------------------------------------------------------------------------------*/

import { createTypesafeFormSchema, InferType } from "@/components/ui/typesafe-form"
import { atomWithStorage } from "jotai/utils"
import { useImmerAtom } from "jotai-immer"
import { useCallback } from "react"


import { fileOrDirectoryExists } from "@/lib/helpers/file"

export const settingsSchema = createTypesafeFormSchema(({ z }) => z.object({
    library: z.object({
        localDirectory: z.string().nullable().refine(async (value) => {
            if (value) {
                return await fileOrDirectoryExists(value)
            }
            return false
        }, { message: "Directory does not exist" }).transform(value => value?.replaceAll("/", "\\")),
        ignoredPaths: z.array(z.string()),
        lockedPaths: z.array(z.string()),
    }),
    player: z.object({
        defaultPlayer: z.enum(["mpc-hc", "vlc"]),
        "mpc-hc": z.string(),
        "vlc": z.string(),
        host: z.string(),
        mpcPort: z.number(),
        vlcPort: z.number(),
        vlcUsername: z.string(),
        vlcPassword: z.string(),
        pauseAfterOpening: z.boolean(),
        audioLng: z.string(),
        subtitleLng: z.string(),
    }),
}))

export type Settings = InferType<typeof settingsSchema>

export const initialSettings: Settings = {
    library: {
        localDirectory: "E\\:ANIME",
        ignoredPaths: [],
        lockedPaths: [],
    },
    player: {
        defaultPlayer: "mpc-hc",
        "mpc-hc": "C:\\Program Files\\MPC-HC\\mpc-hc64.exe",
        vlc: "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
        host: "127.0.0.1",
        mpcPort: 13579,
        vlcPort: 8080,
        vlcUsername: "",
        vlcPassword: "seanime",
        pauseAfterOpening: true,
        audioLng: "jpn",
        subtitleLng: "eng",
    },
}

/* -------------------------------------------------------------------------------------------------
 * Atoms
 * -----------------------------------------------------------------------------------------------*/

export const settingsAtoms = atomWithStorage<Settings>("sea-settings", initialSettings)

/* -------------------------------------------------------------------------------------------------
 * Hooks
 * -----------------------------------------------------------------------------------------------*/

export function useSettings() {

    const [settings, setSettings] = useImmerAtom(settingsAtoms)

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
        updateSettingsWithPrev: useCallback(<K extends keyof Settings>(key: K, value: (prev: Settings[K]) => Partial<Settings[K]>) => {
            setSettings(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    ...value(prev[key]),
                },
            }))
        }, []),
        addMarkedPaths: useCallback(<K extends "ignored" | "locked">(key: K, values: string[]) => {
            setSettings(prev => ({
                ...prev,
                library: {
                    ...prev.library,
                    [key + "Paths" as ("ignoredPaths" | "lockedPaths")]: [
                        ...prev.library[key + "Paths" as ("ignoredPaths" | "lockedPaths")],
                        ...values,
                    ],
                },
            }))
        }, []),
        removeMarkedPaths: useCallback(<K extends "ignored" | "locked">(key: K, values: string[]) => {
            setSettings(prev => ({
                ...prev,
                library: {
                    ...prev["library"],
                    [key + "Paths" as ("ignoredPaths" | "lockedPaths")]: prev["library"][key + "Paths" as ("ignoredPaths" | "lockedPaths")].filter(n => !values.includes(n)),
                },
            }))
        }, []),
    }

}

/**
 * Put at the root of the project
 * When settings change -> do something
 */
export function useSettingsEffects() {

    // const settings = useAtomValue(settingsAtoms)

}
