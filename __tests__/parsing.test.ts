import rakun from "@/lib/rakun"
import { describe, expect, it, test } from "vitest"
import cases from "./cases/parsing.cases"

describe("Media title", () => {
    it.each(cases.mediaTitle)("should be parsed correctly from $filename", ({ filename, expected }) => {
        expect.soft(rakun.parse(filename)).toHaveProperty("name", expected)
    })
})

describe("Single episode", () => {
    test.each(cases.singleEpisode.simpleMediaTitles)("parsed from simple title $filename", ({ filename, expected }) => {
        expect.soft(rakun.parse(filename)).toContain(expected)
    })
    test.each(cases.singleEpisode.longMediaTitles)("parsed from long title $filename", ({ filename, expected }) => {
        expect.soft(rakun.parse(filename)).toContain(expected)
    })
    test.each(cases.singleEpisode.episodeTitles)("parsed from title with episode title $filename", ({ filename, expected }) => {
        expect.soft(rakun.parse(filename)).toContain(expected)
    })
    test.each(cases.singleEpisode.versioning)("parsed from versioned $filename", ({ filename, expected }) => {
        expect.soft(rakun.parse(filename)).toContain(expected)
    })
    test.each(cases.singleEpisode.alphanumeric)("parsed from alphanumeric title $filename", ({ filename, expected }) => {
        expect.soft(rakun.parse(filename)).toContain(expected)
    })

    it.each(cases.singleEpisode.notBeParsed)("should NOT be parsed from $filename", ({ filename, notExpected }) => {
        expect.soft(rakun.parse(filename)).not.toContain(notExpected)
    })
})

describe("Episode range", () => {
    describe.each(cases.episodeRange)("Episode range from $filename", ({ filename, expected }) => {
        it("should be parsed correctly without episodes", () => {
            expect.soft(rakun.parse(filename)).toContain(expected)
        })
        test("episode should NOT be parsed", () => {
            expect.soft(rakun.parse(filename)).not.toHaveProperty("episode")
            expect.soft(rakun.parse(filename)).not.toHaveProperty("episode")
        })
    })
})

describe("Single season", () => {
    it.each(cases.singleSeason)("should be parsed correctly from $filename", ({ filename, expected }) => {
        expect.soft(rakun.parse(filename)).toContain(expected)
    })
})

describe("Season range", () => {
    it.each(cases.seasonRange.parsedCorrectly)("should be parsed correctly from $filename", ({ filename, expected }) => {
        expect.soft(rakun.parse(filename)).toContain(expected)
    })

    it.each(cases.seasonRange.notBeParsed)("should NOT be parsed from $filename", ({ filename, expected }) => {
        expect.soft(rakun.parse(filename)).not.toContain(expected)
    })
})

describe("Part", () => {
    it.each(cases.part)("should be parsed correctly from $filename", ({ filename, expected }) => {
        expect.soft(rakun.parse(filename)).toContain(expected)
    })
})

describe("Cour", () => {
    it.each(cases.cour)("should be parsed correctly from $filename", ({ filename, expected }) => {
        expect.soft(rakun.parse(filename)).toContain(expected)
    })
})

describe("Combination", () => {
    it.each(cases.combination)("should be parsed correctly from $filename", ({ filename, expected }) => {
        expect.soft(rakun.parse(filename)).toContain(expected)
    })
})


describe("Episode title", () => {
    it.each(cases.episodeTitle)("should be parsed correctly from $filename", ({ filename, expected }) => {
        expect.soft(rakun.parse(filename)).toContain(expected)
    })
})
