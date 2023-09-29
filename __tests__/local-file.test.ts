import { afterAll, describe, expect, it, vi } from "vitest"
import { createLocalFile, hydrateLocalFileWithInitialMetadata } from "@/lib/local-library/local-file"
import { initialSettings } from "@/atoms/settings"
import { ScanLogging } from "@/lib/local-library/logs"
import cases from "./cases/local-file.cases"
import parsingCases from "./cases/parsing.cases"
import { AnilistShortMedia } from "@/lib/anilist/fragment"
import { __episodeNormalizationMatchingCases } from "./cases/episode-normalization.cases"
import { experimental_analyzeMediaTree } from "@/lib/anilist/actions"
import { __SampleMedia } from "./samples/media.sample"
import { valueContainsNC, valueContainsSpecials } from "@/lib/local-library/utils/filtering.utils"


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
        // console.log(localFile)
        expect(localFile).toEqual(expected)
    })
})

const _cache = new Map<number, AnilistShortMedia>
const _aniZipCache = new Map<number, AniZipData>

describe.skip("Get media tree", () => {

    it("returns media tree", async () => {

        const result = await experimental_analyzeMediaTree({ media: __SampleMedia["Bungou Stray Dogs Season 4"], _mediaCache: _cache, _aniZipCache })
        console.log(result.listWithInfo.map(n => n.media.title?.english))
        expect(result.listWithInfo.length).toBeGreaterThan(4)

    }, { timeout: 10000 })

})

describe.skip("Episode normalization", () => {

    describe.each(__episodeNormalizationMatchingCases)("Episode files matched with $media.title.english", ({ media, cases }) => {

        it.each(cases)("should be correctly normalized $name (Episode $expected.relativeEpisode)", async ({ path, name, expected }) => {
            const hydratedLocalFile = await hydrateLocalFileWithInitialMetadata({
                file: await createLocalFile(settings, { path, name }, scanLogging),
                media: media,
                _mediaCache: _cache,
                _aniZipCache: _aniZipCache,
                _scanLogging: scanLogging,
            })
            expect.soft(hydratedLocalFile.file.metadata.episode).toEqual(expected.relativeEpisode)
            expect.soft(hydratedLocalFile.file.mediaId).toEqual(expected.mediaId)
            // console.log(hydratedLocalFile)
            // console.log(_cache)
        }, { timeout: 1000000 })

    })

})
afterAll(() => {
    // console.log(_cache)
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
