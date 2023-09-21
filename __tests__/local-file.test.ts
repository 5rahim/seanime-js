import { describe, expect, it, vi } from "vitest"
import { createLocalFile, hydrateLocalFileWithInitialMetadata } from "@/lib/local-library/local-file"
import { initialSettings } from "@/atoms/settings"
import { ScanLogging } from "@/lib/local-library/logs"
import cases from "./cases/local-file.cases"
import parsingCases from "./cases/parsing.cases"
import { AnilistShortMedia } from "@/lib/anilist/fragment"
import { valueContainsNC, valueContainsSpecials } from "@/lib/local-library/utils"


vi.mock("react", async () => {
    const actual = (await vi.importActual("react")) as any
    return {
        ...actual,
        cache: vi.fn(v => v),
    }
})
vi.mock("@/lib/local-library/logs")

const scanLogging = new ScanLogging

const settings = {
    ...initialSettings,
    library: {
        localDirectory: "E:/ANIME",
    },
}

describe("Local file", () => {

    it.each(cases.createLocalFile)("should be created from $initialProps.path", async ({ initialProps, expected }) => {
        const localFile = await createLocalFile(settings, initialProps, scanLogging)
        console.log(localFile)
        expect(localFile).toEqual(expected)
    })
})


describe.sequential("Initial metadata hydration", () => {

    const _cache = new Map<number, AnilistShortMedia>
    const _aniZipCache = new Map<number, AniZipData>

    it.each(cases.initialMetadata)("should be hydrated correctly from $localFile.path", async ({ localFile, media, expected }) => {
        const hydratedLocalFile = await hydrateLocalFileWithInitialMetadata({
            file: localFile,
            media: media,
            _cache,
            _aniZipCache,
            _scanLogging: scanLogging,
        })
        expect.soft(hydratedLocalFile).toHaveProperty("metadata", expected.metadata)
        expect.soft(hydratedLocalFile).toHaveProperty("mediaId", expected.mediaId)
        console.log(hydratedLocalFile)
    })

    _aniZipCache.clear()
    _cache.clear()

})

describe("Special/NC detection", () => {
    it.each([
        { filename: "Kakegurui - S00E01 - Maid Cafe Hyakkaou.mkv" },
    ])("should be `Special` $filename", ({ filename }) => {
        expect(valueContainsSpecials(filename)).toBe(true)
    })

    it.each([
        { filename: "[Anime Time] Durarara!!×2 Ten OVA ED 1.mkv" },
    ])("should NOT be `Special` $filename", ({ filename }) => {
        expect(valueContainsSpecials(filename)).toBe(false)
    })

    it.each([
        { filename: "[Anime Time] Durarara!! ED 2.mkv" },
        { filename: "[Anime Time] Durarara!!×2 Shou OP 1.mkv" },
        { filename: "[Anime Time] Durarara!!×2 Ten OVA ED 1.mkv" },
    ])("should be `NC` $filename", ({ filename }) => {
        expect(valueContainsNC(filename)).toBe(true)
    })

    it.each([
        ...parsingCases.singleEpisode.notBeParsed.map(n => ({ filename: n.filename })),
        ...parsingCases.singleEpisode.episodeTitles.map(n => ({ filename: n.filename })),
        ...parsingCases.singleEpisode.alphanumeric.map(n => ({ filename: n.filename })),
        ...parsingCases.singleEpisode.longMediaTitles.map(n => ({ filename: n.filename })),
        ...parsingCases.singleEpisode.simpleMediaTitles.map(n => ({ filename: n.filename })),
        ...parsingCases.singleEpisode.versioning.map(n => ({ filename: n.filename })),
        ...parsingCases.cour.map(n => ({ filename: n.filename })),
        ...parsingCases.part.map(n => ({ filename: n.filename })),
        ...parsingCases.combination.map(n => ({ filename: n.filename })),
    ])("should NOT be flagged $filename", ({ filename }) => {
        expect(valueContainsNC(filename)).toBe(false)
        expect(valueContainsSpecials(filename)).toBe(false)
    })


})
