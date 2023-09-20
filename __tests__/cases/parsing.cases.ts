export default {
    mediaTitle: [
        { filename: "[Judas] Zom 100: Zombie ni Naru Made ni Shitai 100 no Koto", expected: "Zom 100: Zombie ni Naru Made ni Shitai 100 no Koto" },
        { filename: "[Erai-raws] Ryza no Atelier - Tokoyami no Joou to Himitsu no Kakurega - 12 [1080p][HEVC][Multiple Subtitle] [ENG][POR-BR].mkv", expected: "Ryza no Atelier - Tokoyami no Joou to Himitsu no Kakurega" },
        { filename: "[EMBER] In/Spectre (2023) (Season 2) [BDRip] [1080p Dual Audio HEVC 10 bits] (Kyokou Suiri Season 2) (Batch)", expected: "In/Spectre (2023) (Kyokou Suiri Season 2)" },
        { filename: "[SubsPlease] 86 - Eighty Six - 20v2 (1080p) [30072859].mkv", expected: "86 - Eighty Six" },
    ],
    singleEpisode: {
        simpleMediaTitles: [
            { filename: "[Judas] Blue Lock - S01E05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Blue Lock - S01_E05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Blue Lock - S01_05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Blue Lock - S01 - E05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Blue Lock - S01 - 05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Blue Lock - S01 05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Blue Lock - S01x05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Blue Lock - 01x05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Blue Lock - E05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Blue Lock - 05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Blue Lock - 01x05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Blue Lock - 5.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Blue Lock 05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Blue Lock 15.mkv", expected: { episode: "15" } },
            { filename: "[Judas] 05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] 05 - Episode title.mkv", expected: { episode: "5" } },
            { filename: "[Chihiro] Hataraku Maou-sama!! 22 [1080p Hi10P AAC][4ADF2D98].mkv", expected: { episode: "22" } },
            { filename: "[Erai-raws] Edens Zero 2nd Season - 24 [1080p][HEVC][Multiple Subtitle] [ENG][POR-BR][SPA-LA][ARA][RUS].mkv", expected: { episode: "24" } },
        ],
        longMediaTitles: [
            { filename: "[Erai-raws] Ryza no Atelier - Tokoyami no Joou to Himitsu no Kakurega - 12 [1080p][HEVC][Multiple Subtitle] [ENG][POR-BR].mkv", expected: { episode: "12" } },
        ],
        episodeTitles: [
            { filename: "[Judas] Blue Lock - 05 - Episode title.mkv", expected: { episode: "5" } },
            { filename: "[Judas] One Piece - 1075 - Episode title.mkv", expected: { episode: "1075" } },
            { filename: "[Judas] Blue Lock 05 Episode title.mkv", expected: { episode: "5" } },
        ],
        versioning: [
            { filename: "[Judas] Blue Lock - S01E05v2.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Blue Lock - S01E05 v2.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Blue Lock - S01E05'.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Blue Lock - 5.2 .mkv", expected: { episode: "5" } },
            { filename: "[Judas] Cowboy Bebop - S01E17v2.mkv", expected: { episode: "17" } },
        ],
        alphanumeric: [
            { filename: "[ASW] Yami Shibai 11 - 12 [1080p HEVC x265 10Bit][AAC].mkv", expected: { episode: "12" } },
            { filename: "[Judas] Mob Psycho 100 - 05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Mob Psycho 100 05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Mob Psycho 100 - 10.mkv", expected: { episode: "10" } },
            { filename: "[Judas] Zom 100: Zombie ni Naru Made ni Shitai 100 no Koto - 05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Zom 100: Zombie ni Naru Made ni Shitai 100 no Koto 05.mkv", expected: { episode: "5" } },
            { filename: "[Judas] Zom 100: Zombie ni Naru Made ni Shitai 100 no Koto - 10.mkv", expected: { episode: "10" } },
            { filename: "[Judas] Zom 100: Zombie ni Naru Made ni Shitai 100 no Koto - 100.mkv", expected: { episode: "100" } },
        ],
        notBeParsed: [
            { filename: "[Judas] Blue Lock 5.mkv", notExpected: { episode: "5" } },
            { filename: "[Judas] Blue Lock - S1-5.mkv", notExpected: { episode: "5" } },
            { filename: "[Judas] Blue Lock - S01-05.mkv", notExpected: { episode: "5" } },
        ],
    },
    episodeRange: [
        { filename: "[PirateLimitedXD] SPY×FAMILY 13-25 Batch (1080p)", expected: { episodeRange: "13 25" } },
        { filename: "[PirateLimitedXD] SPY×FAMILY 13 ~ 25 Batch (1080p)", expected: { episodeRange: "13 25" } },
        { filename: "[PirateLimitedXD] SPY×FAMILY - 13 - 25 Batch (1080p)", expected: { episodeRange: "13 25" } },
    ],
    singleSeason: [
        { filename: "[Judas] Blue Lock - S01E05.mkv", expected: { season: "1" } },
        { filename: "[Judas] Blue Lock - S01_E05.mkv", expected: { season: "1" } },
        { filename: "[Judas] Blue Lock - S01_05.mkv", expected: { season: "1" } },
        { filename: "[Judas] Blue Lock S1.mkv", expected: { season: "1" } },
        { filename: "[Judas] Blue Lock S04.mkv", expected: { season: "4" } },
        { filename: "[Judas] Blue Lock 01x05.mkv", expected: { season: "1" } },
        { filename: "[Judas] Blue Lock S01x05.mkv", expected: { season: "1" } },
        { filename: "[Erai-raws] Edens Zero S2 - 24 [1080p][HEVC][Multiple Subtitle].mkv", expected: { season: "2" } },
        { filename: "[Anime Time] Ooku The Inner Chambers (Season 01) [NF] [1080p][HEVC 10bit x265][AAC][Multi Sub] [Batch]", expected: { season: "1" } },
        { filename: "[Erai-raws] Edens Zero 1st Season - 24 [1080p][HEVC][Multiple Subtitle].mkv", expected: { season: "1" } },
        { filename: "[Erai-raws] Edens Zero 2nd Season - 24 [1080p][HEVC][Multiple Subtitle].mkv", expected: { season: "2" } },
        { filename: "[Erai-raws] Edens Zero 3rd Season - 24 [1080p][HEVC][Multiple Subtitle].mkv", expected: { season: "3" } },
        { filename: "[Erai-raws] Edens Zero (4th Season) - 24 [1080p][HEVC][Multiple Subtitle].mkv", expected: { season: "4" } },
    ],
    seasonRange: {
        parsedCorrectly: [
            { filename: "[Hello] SPY×FAMILY S1-5 Batch", expected: { seasonRange: "1 5" } },
            { filename: "[Hello] SPY×FAMILY S01-05 Batch", expected: { seasonRange: "01 05" } },
            { filename: "[Hello] SPY×FAMILY S01~05 Batch", expected: { seasonRange: "01 05" } },
            { filename: "[Hello] SPY×FAMILY S1-S5 Batch", expected: { seasonRange: "1 5" } },
            { filename: "[Hello] SPY×FAMILY S01-S05 Batch", expected: { seasonRange: "01 05" } },
            { filename: "[Hello] SPY×FAMILY S1 - S5 Batch", expected: { seasonRange: "1 5" } },
            { filename: "[Hello] SPY×FAMILY S01 - S05 Batch", expected: { seasonRange: "01 05" } },
        ],
        notBeParsed: [
            { filename: "[PirateLimitedXD] SPY×FAMILY S01 - 05 Batch (1080p)", expected: { seasonRange: "01 05" } },
            { filename: "[Hello] SPY×FAMILY S01 ~ 05 Batch", expected: { seasonRange: "01 05" } },
        ],
    },
    cour: [
        { filename: "[Erai-raws] Spy x Family Cour 2 - 01 [480p][Multiple Subtitle] [ENG]", expected: { cour: "2" } },
    ],
    part: [
        { filename: "[Judas] Dr. Stone (Season 3 Part 1) [1080p][HEVC x265 10bit][Multi-Subs] (Batch)", expected: { part: "1" } },
        { filename: "[EMBER] Shingeki no Kyojin (2023) (Season 4 Part 03 [EP: 29-31]) [1080p] [Dual Audio HEVC WEBRip DDP]", expected: { part: "3" } },
    ],
    combination: [
        {
            filename: "[EMBER] Shingeki no Kyojin (2023) (Season 4 Part 03 [EP: 29-31]) [1080p] [Dual Audio HEVC WEBRip DDP]",
            expected: {
                season: "4",
                part: "3",
                episodeRange: "29 31",
            },
        },
        {
            filename: "[Trix] Shingeki no Kyojin - S04E29-31 (Part 3) [Multi Subs] (1080p AV1 E-AC3)",
            expected: {
                season: "4",
                part: "3",
                episodeRange: "29 31",
            },
        },
    ],
    episodeTitle: [
        { filename: "Cowboy Bebop - S01E01 - Asteroid Blues.mkv", expected: { episodeTitle: "Asteroid Blues" } },
        { filename: "[Judas] Blue Lock - E05 - Episode title.mkv", expected: { episodeTitle: "Episode title" } },
        { filename: "[Judas] Blue Lock - 05 - Episode title.mkv", expected: { episodeTitle: "Episode title" } },
        { filename: "[Judas] One Piece - 1075 - Episode title.mkv", expected: { episodeTitle: "Episode title" } },
        { filename: "S01E04-The Reason for Her Smile I Want to Be Playful Like a Girl Heroes Fall a Lot [9475473E].mkv", expected: { episodeTitle: "The Reason for Her Smile I Want to Be Playful Like a Girl Heroes Fall a Lot" } },
        { filename: "E04-The Reason for Her Smile I Want to Be Playful Like a Girl Heroes Fall a Lot [9475473E].mkv", expected: { episodeTitle: "The Reason for Her Smile I Want to Be Playful Like a Girl Heroes Fall a Lot" } },
        { filename: "E04 - The Reason for Her Smile I Want to Be Playful Like a Girl Heroes Fall a Lot [9475473E].mkv", expected: { episodeTitle: "The Reason for Her Smile I Want to Be Playful Like a Girl Heroes Fall a Lot" } },
    ],
}