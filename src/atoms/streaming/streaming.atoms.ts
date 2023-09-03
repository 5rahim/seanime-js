import { atomWithStorage } from "jotai/utils"
import { GogoAnimeServer, ZoroServer } from "@/lib/consumet/types"

export type StreamingProvider = "gogoanime" | "zoro"

export const streamingProviderAtom = atomWithStorage<StreamingProvider>("sea-streaming-provider", "gogoanime", undefined, { unstable_getOnInit: true })

export const zoroStreamingServerAtom = atomWithStorage<ZoroServer>("sea-streaming-zoro-server", "vidstreaming", undefined, { unstable_getOnInit: true })

export const gogoAnimeStreamingServerAtom = atomWithStorage<GogoAnimeServer>("sea-streaming-gogoanime-server", "gogocdn", undefined, { unstable_getOnInit: true })
