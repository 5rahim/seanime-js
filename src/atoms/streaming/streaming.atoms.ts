import { atomWithStorage } from "jotai/utils"

export type StreamingProvider = "gogoanime" | "zoro"

export const streamingProviderAtom = atomWithStorage<StreamingProvider>("sea-streaming-provider", "gogoanime", undefined, { unstable_getOnInit: true })
