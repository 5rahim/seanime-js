import { describe, expect, it, vi } from "vitest"

import { initialSettings } from "@/atoms/settings"
import { getMediaTitlesFromLocalDirectory } from "@/lib/local-library/repository"
import { scanLibraryMedia } from "@/lib/local-library/blind-scan"
import { ScanLogging } from "@/lib/local-library/logs"
import { AnilistShortMedia } from "@/lib/anilist/fragment"

vi.mock("react", async () => {
    const actual = (await vi.importActual("react")) as any
    return {
        ...actual,
        cache: vi.fn(v => v),
    }
})

const settings = {
    ...initialSettings,
    library: {
        localDirectory: "E:/ANIME",
    },
}

describe.skip("Media titles", () => {

    it("should retrieve all media titles from a local directory", async () => {
        const result = await getMediaTitlesFromLocalDirectory({ directoryPath: "E:/ANIME" })
        console.log(result)
        expect(result).toBeDefined()
    })

})

describe.skip("Blind scan", () => {

    it("should scan the local library", async () => {

        const _scanLogging = new ScanLogging()
        const _aniZipCache = new Map<number, AniZipData>()
        const _mediaCache = new Map<number, AnilistShortMedia>

        const result = await scanLibraryMedia({ settings, _scanLogging, _aniZipCache, _mediaCache })

        _scanLogging.clear()
        _aniZipCache.clear()
        _mediaCache.clear()

        console.log(result)
        expect(result).toBeDefined()
    }, { timeout: 1000000 })

})
