/* -------------------------------------------------------------------------------------------------
 * Schema
 * -----------------------------------------------------------------------------------------------*/

import { createTypesafeFormSchema, InferType } from "@/components/ui/typesafe-form"
import { atomWithStorage } from "jotai/utils"
import { useImmerAtom, withImmer } from "jotai-immer"
import { useCallback } from "react"
import { fileOrDirectoryExists } from "@/lib/helpers/file"
import { useSetAtom } from "jotai/react"
import path from "path"
import * as upath from "upath"

export const settingsSchema = createTypesafeFormSchema(({ z }) => z.object({
    library: z.object({
        localDirectory: z.string().nullable().refine(async (value) => value ? await fileOrDirectoryExists(value) : false, { message: "Directory does not exist" })
            .transform(value => {
                const _v = !!value ? (value.endsWith(path.sep) ? (value.slice(0, -1)) : (value)) : undefined
                return _v ? upath.normalize(_v) : undefined
            }),
    }),
    player: z.object({
        defaultPlayer: z.enum(["mpc-hc", "vlc"]),
        "mpc-hc": z.string().refine(async (value) => value ? await fileOrDirectoryExists(value) : false, { message: "File does not exist" }),
        "vlc": z.string().refine(async (value) => value ? await fileOrDirectoryExists(value) : false, { message: "File does not exist" }),
        host: z.string(),
        mpcPort: z.number(),
        vlcPort: z.number(),
        vlcUsername: z.string(),
        vlcPassword: z.string(),
        pauseAfterOpening: z.boolean(),
        audioLng: z.string(),
        subtitleLng: z.string(),
    }),
    qbittorrent: z.object({
        host: z.string().transform(value => value?.replace("http://", "").replaceAll("/", "")),
        port: z.number(),
        username: z.string().default(""),
        password: z.string().default(""),
        path: z.string().refine(async (value) => value ? await fileOrDirectoryExists(value) : false, { message: "File does not exist" }),
    }),
    torrent: z.object({
        nyaaUrl: z.string(),
    }),
    anilist: z.object({
        showAudienceScore: z.boolean(),
    }),
}))

export type Settings = InferType<typeof settingsSchema>

export const initialSettings: Settings = {
    library: {
        localDirectory: undefined,
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
    qbittorrent: {
        host: "127.0.0.1",
        port: 8081,
        username: "admin",
        password: "adminadmin",
        path: "C:\\Program Files\\qBittorrent\\qbittorrent.exe",
    },
    torrent: {
        nyaaUrl: "nyaa.si",
    },
    anilist: {
        showAudienceScore: true,
    },
}

/* -------------------------------------------------------------------------------------------------
 * Atoms
 * -----------------------------------------------------------------------------------------------*/

export const settingsAtoms = atomWithStorage<Settings>("sea-settings", initialSettings, undefined, { unstable_getOnInit: true })

export const _settingsAtom = withImmer(settingsAtoms)

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
    }

}

export function useUpdateSettings() {
    return useSetAtom(_settingsAtom)
}
