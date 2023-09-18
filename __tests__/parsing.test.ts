import rakun from "@/lib/rakun"
import { describe, expect, it, test } from "vitest"

describe("Media title", () => {
    test("with numbers", () => {
        expect.soft(rakun.parse("[Judas] Zom 100: Zombie ni Naru Made ni Shitai 100 no Koto - 05.mkv")).toHaveProperty("name", "Zom 100: Zombie ni Naru Made ni Shitai 100 no Koto")
    })
    test("with dash", () => {
        expect.soft(rakun.parse("[Erai-raws] Ryza no Atelier - Tokoyami no Joou to Himitsu no Kakurega - 12 [1080p][HEVC][Multiple Subtitle] [ENG][POR-BR].mkv")).toHaveProperty("name", "Ryza no Atelier - Tokoyami no Joou to Himitsu no Kakurega")
    })
    test("with secondary title", () => {
        expect.soft(rakun.parse("[EMBER] In/Spectre (2023) (Season 2) [BDRip] [1080p Dual Audio HEVC 10 bits] (Kyokou Suiri Season 2) (Batch)")).toHaveProperty("name", "In/Spectre (2023) (Kyokou Suiri Season 2)")
    })
})

describe("Single episode", () => {
    test("with simple media titles", () => {
        expect.soft(rakun.parse("[Judas] Blue Lock - S01E05.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Blue Lock - S01_E05.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Blue Lock - S01_05.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Blue Lock - S01 - E05.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Blue Lock - S01 - 05.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Blue Lock - S01 05.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Blue Lock - E05.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Blue Lock - 05.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Blue Lock - 01x05.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Blue Lock - 5.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Blue Lock 05.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] 05.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] 05 - Episode title.mkv")).toHaveProperty("episode", "5")

        expect.soft(rakun.parse("[Erai-raws] Ryza no Atelier - Tokoyami no Joou to Himitsu no Kakurega - 12 [1080p][HEVC][Multiple Subtitle] [ENG][POR-BR].mkv")).toHaveProperty("episode", "12")
        expect.soft(rakun.parse("[Chihiro] Hataraku Maou-sama!! 22 [1080p Hi10P AAC][4ADF2D98].mkv")).toHaveProperty("episode", "22")

        expect.soft(rakun.parse("[Erai-raws] Edens Zero 2nd Season - 24 [1080p][HEVC][Multiple Subtitle] [ENG][POR-BR][SPA-LA][ARA][RUS].mkv")).toHaveProperty("episode", "24")
    })

    test("with episode title", () => {
        expect.soft(rakun.parse("[Judas] Blue Lock - 05 - Episode title.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] One Piece - 1075 - Episode title.mkv")).toHaveProperty("episode", "1075")
        expect.soft(rakun.parse("[Judas] Blue Lock 05 Episode title.mkv")).toHaveProperty("episode", "5")
    })

    test("with versioning", () => {
        expect.soft(rakun.parse("[Judas] Blue Lock - S01E05v2.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Blue Lock - S01E05 v2.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Blue Lock - S01E05'.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Blue Lock - 5.2 .mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Cowboy Bebop - S01E17v2.mkv")).toHaveProperty("episode", "17")
    })

    test("with alphanumeric media titles", () => {
        expect.soft(rakun.parse("[ASW] Yami Shibai 11 - 12 [1080p HEVC x265 10Bit][AAC].mkv")).toHaveProperty("episode", "12")
        expect.soft(rakun.parse("[Judas] Mob Psycho 100 - 05.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Mob Psycho 100 05.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Mob Psycho 100 - 10.mkv")).toHaveProperty("episode", "10")
        expect.soft(rakun.parse("[Judas] Zom 100: Zombie ni Naru Made ni Shitai 100 no Koto - 05.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Zom 100: Zombie ni Naru Made ni Shitai 100 no Koto 05.mkv")).toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Zom 100: Zombie ni Naru Made ni Shitai 100 no Koto - 10.mkv")).toHaveProperty("episode", "10")
        expect.soft(rakun.parse("[Judas] Zom 100: Zombie ni Naru Made ni Shitai 100 no Koto - 100.mkv")).toHaveProperty("episode", "100")
    })

    it("should not be parsed", () => {
        expect.soft(rakun.parse("[Judas] Blue Lock 5.mkv")).not.toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Blue Lock - S1-5.mkv")).not.toHaveProperty("episode", "5")
        expect.soft(rakun.parse("[Judas] Blue Lock - S01-05.mkv")).not.toHaveProperty("episode", "5")
    })
})

describe("Episode range", () => {
    it("should be parsed correctly", () => {
        expect.soft(rakun.parse("[PirateLimitedXD] SPY×FAMILY 13-25 Batch (1080p)")).toHaveProperty("episodeRange", "13 25")
        expect.soft(rakun.parse("[PirateLimitedXD] SPY×FAMILY 13 ~ 25 Batch (1080p)")).toHaveProperty("episodeRange", "13 25")
        expect.soft(rakun.parse("[PirateLimitedXD] SPY×FAMILY - 13 - 25 Batch (1080p)")).toHaveProperty("episodeRange", "13 25")
    })
})

describe("Single season", () => {
    test("normal format", () => {
        expect.soft(rakun.parse("[Judas] Blue Lock - S01E05.mkv")).toHaveProperty("season", "1")
        expect.soft(rakun.parse("[Judas] Blue Lock - S01_E05.mkv")).toHaveProperty("season", "1")
        expect.soft(rakun.parse("[Judas] Blue Lock - S01_05.mkv")).toHaveProperty("season", "1")
        expect.soft(rakun.parse("[Judas] Blue Lock S1.mkv")).toHaveProperty("season", "1")
        expect.soft(rakun.parse("[Judas] Blue Lock S04.mkv")).toHaveProperty("season", "4")
        expect.soft(rakun.parse("[Erai-raws] Edens Zero S2 - 24 [1080p][HEVC][Multiple Subtitle].mkv")).toHaveProperty("season", "2")
    })
    test("in parentheses", () => {
        expect.soft(rakun.parse("[Anime Time] Ooku The Inner Chambers (Season 01) [NF] [1080p][HEVC 10bit x265][AAC][Multi Sub] [Batch]")).toHaveProperty("season", "1")
    })
    test("ordinalized format", () => {
        expect.soft(rakun.parse("[Erai-raws] Edens Zero 1st Season - 24 [1080p][HEVC][Multiple Subtitle].mkv")).toHaveProperty("season", "1")
        expect.soft(rakun.parse("[Erai-raws] Edens Zero 2nd Season - 24 [1080p][HEVC][Multiple Subtitle].mkv")).toHaveProperty("season", "2")
    })
})

describe("Season range", () => {
    it("should be parsed correctly", () => {
        expect.soft(rakun.parse("[Hello] SPY×FAMILY S1-5 Batch")).toHaveProperty("seasonRange", "1 5")

        expect.soft(rakun.parse("[Hello] SPY×FAMILY S01-05 Batch")).toHaveProperty("seasonRange", "01 05")

        expect.soft(rakun.parse("[Hello] SPY×FAMILY S01~05 Batch")).toHaveProperty("seasonRange", "01 05")

        expect.soft(rakun.parse("[Hello] SPY×FAMILY S1-S5 Batch")).toHaveProperty("seasonRange", "1 5")

        expect.soft(rakun.parse("[Hello] SPY×FAMILY S01-S05 Batch")).toHaveProperty("seasonRange", "01 05")

        expect.soft(rakun.parse("[Hello] SPY×FAMILY S1 - S5 Batch")).toHaveProperty("seasonRange", "1 5")

        expect.soft(rakun.parse("[Hello] SPY×FAMILY S01 - S05 Batch")).toHaveProperty("seasonRange", "01 05")
    })

    it("should not be parsed", () => {
        expect.soft(rakun.parse("[PirateLimitedXD] SPY×FAMILY S01 - 05 Batch (1080p)")).not.toHaveProperty("seasonRange", "01 05")
        expect.soft(rakun.parse("[Hello] SPY×FAMILY S01 ~ 05 Batch")).not.toHaveProperty("seasonRange", "01 05")
    })
})

describe("Part", () => {
    it("should be parsed correctly", () => {
        const _1 = rakun.parse("[Judas] Dr. Stone (Season 3 Part 1) [1080p][HEVC x265 10bit][Multi-Subs] (Batch)")
        expect.soft(_1).toHaveProperty("season", "3")
        expect.soft(_1).toHaveProperty("part", "1")

        const _2 = rakun.parse("[Judas] Dr. Stone Season 3 Part 01 [1080p][HEVC x265 10bit][Multi-Subs] (Batch)")
        expect.soft(_2).toHaveProperty("season", "3")
        expect.soft(_2).toHaveProperty("part", "1")
    })
})

describe("Cour", () => {
    it("should be parsed correctly", () => {
        const _1 = rakun.parse("[Erai-raws] Spy x Family Cour 2 - 01 [480p][Multiple Subtitle] [ENG]")
        expect.soft(_1).toHaveProperty("cour", "2")
        expect.soft(_1).toHaveProperty("episode", "1")

        const _2 = rakun.parse("[Erai-raws] Spy x Family Cour 2 - 13 [480p][Multiple Subtitle] [ENG]")
        expect.soft(_2).toHaveProperty("cour", "2")
        expect.soft(_2).toHaveProperty("episode", "13")
    })
})

describe("Season and Part", () => {
    it("should be parsed correctly", () => {
        const _1 = rakun.parse("[EMBER] Shingeki no Kyojin (2023) (Season 4 Part 03 [EP: 29-31]) [1080p] [Dual Audio HEVC WEBRip DDP]")
        expect.soft(_1).toHaveProperty("season", "4")
        expect.soft(_1).toHaveProperty("part", "3")

        const _2 = rakun.parse("[Trix] Shingeki no Kyojin - S04E29-31 (Part 3) [Multi Subs] (1080p AV1 E-AC3)")
        expect.soft(_2).toHaveProperty("season", "4")
        expect.soft(_2).toHaveProperty("part", "3")
    })
})


describe("Episode title", () => {
    it("should be parsed correctly", () => {
        expect.soft(rakun.parse("Cowboy Bebop - S01E01 - Asteroid Blues.mkv")).toHaveProperty("episodeTitle", "Asteroid Blues")
        expect.soft(rakun.parse("[Judas] Blue Lock - E05 - Episode title.mkv")).toHaveProperty("episodeTitle", "Episode title")
        expect.soft(rakun.parse("[Judas] Blue Lock - 05 - Episode title.mkv")).toHaveProperty("episodeTitle", "Episode title")
        expect.soft(rakun.parse("[Judas] One Piece - 1075 - Episode title.mkv")).toHaveProperty("episodeTitle", "Episode title")
        expect.soft(rakun.parse("S01E04-The Reason for Her Smile I Want to Be Playful Like a Girl Heroes Fall a Lot [9475473E].mkv")).toHaveProperty("episodeTitle", "The Reason for Her Smile I Want to Be Playful Like a Girl Heroes Fall a Lot")
        expect.soft(rakun.parse("E04-The Reason for Her Smile I Want to Be Playful Like a Girl Heroes Fall a Lot [9475473E].mkv")).toHaveProperty("episodeTitle", "The Reason for Her Smile I Want to Be Playful Like a Girl Heroes Fall a Lot")
        expect.soft(rakun.parse("E04 - The Reason for Her Smile I Want to Be Playful Like a Girl Heroes Fall a Lot [9475473E].mkv")).toHaveProperty("episodeTitle", "The Reason for Her Smile I Want to Be Playful Like a Girl Heroes Fall a Lot")
        expect.soft(rakun.parse("04 - The Reason for Her Smile I Want to Be Playful Like a Girl Heroes Fall a Lot [9475473E].mkv")).toHaveProperty("episodeTitle", "The Reason for Her Smile I Want to Be Playful Like a Girl Heroes Fall a Lot")
    })
})
