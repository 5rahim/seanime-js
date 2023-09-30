import { describe, expect, it, vi } from "vitest"
import { createLocalFile, hydrateLocalFileWithInitialMetadata } from "@/lib/local-library/local-file"
import { initialSettings } from "@/atoms/settings"
import { ScanLogging } from "@/lib/local-library/logs"
import cases from "./cases/local-file.cases"
import parsingCases from "./cases/parsing.cases"
import { AnilistShortMedia } from "@/lib/anilist/fragment"
import { __episodeNormalizationMatchingCases } from "./cases/episode-normalization.cases"
import { experimental_analyzeMediaTree, experimental_fetchMediaTree } from "@/lib/anilist/actions"
import { __SampleMedia } from "./samples/media.sample"
import { valueContainsNC, valueContainsSpecials } from "@/lib/local-library/utils/filtering.utils"
import { fetchAnilistShortMedia } from "@/lib/anilist/helpers"


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


describe.skip("Get media tree", () => {

    it.skip("returns media tree for Bungo Stray Dogs", async () => {
        const _cache = new Map<number, AnilistShortMedia>
        const _aniZipCache = new Map<number, AniZipData>

        const result = await experimental_analyzeMediaTree({ media: __SampleMedia["Bungou Stray Dogs Season 4"], _mediaCache: _cache, _aniZipCache })
        console.log(result.listWithInfo.map(n => n.media.title?.english))
        expect(result.listWithInfo.length).toBeGreaterThan(4)

        _cache.clear()
        _aniZipCache.clear()

    }, { timeout: 10000 })

    it("returns media tree for Attack on Titan", async () => {
        const _cache = new Map<number, AnilistShortMedia>
        const _aniZipCache = new Map<number, AniZipData>

        const media = (await fetchAnilistShortMedia(16498, _cache))!
        const treeMap = new Map<number, AnilistShortMedia>()

        const result = await experimental_fetchMediaTree({
            media: media,
            treeMap,
            _mediaCache: _cache,
        })
        const tree = [...treeMap.values()]
        console.log(tree.findLast(n => n)?.relations?.edges?.find(n => n?.relationType === "SEQUEL"))
        expect(tree.length).toBeGreaterThan(6)

        _cache.clear()
        _aniZipCache.clear()

    }, { timeout: 10000 })

})

describe.skip("Episode normalization", () => {

    describe.each(__episodeNormalizationMatchingCases)("Episode files matched with $media.title.english", ({ media, cases }) => {

        it.each(cases)("should be correctly normalized $name (Episode $expected.relativeEpisode)", async ({ path, name, expected }) => {
            const _cache = new Map<number, AnilistShortMedia>
            const _aniZipCache = new Map<number, AniZipData>

            const hydratedLocalFile = await hydrateLocalFileWithInitialMetadata({
                file: await createLocalFile(settings, { path, name }, scanLogging),
                media: media,
                _mediaCache: _cache,
                _aniZipCache: _aniZipCache,
                _scanLogging: scanLogging,
            })
            expect.soft(hydratedLocalFile.file.metadata.episode).toEqual(expected.relativeEpisode)
            expect.soft(hydratedLocalFile.file.mediaId).toEqual(expected.mediaId)

            _cache.clear()
            _aniZipCache.clear()
            // console.log(hydratedLocalFile)
            // console.log(_cache)
        }, { timeout: 1000000 })

    })

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
