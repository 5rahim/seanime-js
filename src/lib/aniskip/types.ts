/* -------------------------------------------------------------------------------------------------
 * @link https://github.com/lexesjan/typescript-aniskip-extension/blob/main/src/api/aniskip-http-client/aniskip-http-client.types.ts
 * -----------------------------------------------------------------------------------------------*/

export const SKIP_TYPE_NAMES: Record<SkipType, string> = {
    op: "Opening",
    ed: "Ending",
    "mixed-op": "Mixed opening",
    "mixed-ed": "Mixed ending",
    recap: "Recap",
} as const

export const SKIP_TYPES = [
    "op",
    "ed",
    "mixed-op",
    "mixed-ed",
    "recap",
] as const

export type SkipType = (typeof SKIP_TYPES)[number]

export type SkipTime = {
    interval: {
        startTime: number
        endTime: number
    }
    skipType: SkipType
    skipId: string
    episodeLength: number
}
