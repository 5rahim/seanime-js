import { __SampleMedia } from "../samples/media.sample"

export const __episodeNormalizationCases = [
    {
        filename: "E:/ANIME/[Judas] Blue Lock (Season 1) [1080p][HEVC x265 10bit][Dual-Audio][Multi-Subs]/[Judas] Blue Lock - S01E03v2.mkv",
        expected: {
            relativeEpisode: 3,
            mediaId: 100,
        },
    },
    {
        filename: "E:/ANIME/Jujutsu Kaisen/[SubsPlease] Jujutsu Kaisen - 01 (1080p) [40737A9B].mkv",
        expected: {
            relativeEpisode: 1,
            mediaId: 100,
        },
    },
    {
        filename: "E:/ANIME/Jujutsu Kaisen/[SubsPlease] Jujutsu Kaisen - 25 (1080p) [40737A9B].mkv",
        expected: {
            relativeEpisode: 3,
            mediaId: 100,
        },
    },
    {
        filename: "E:/ANIME/Jujutsu Kaisen/[SubsPlease] Jujutsu Kaisen - 26 (1080p) [B73D2DD3].mkv",
        expected: {
            relativeEpisode: 3,
            mediaId: 100,
        },
    },
    {
        filename: "E:/ANIME/Jujutsu Kaisen/[SubsPlease] Jujutsu Kaisen - 27 (1080p) [D4AEE6A7].mkv",
        expected: {
            relativeEpisode: 3,
            mediaId: 100,
        },
    },
    {
        filename: "E:/ANIME/Jujutsu Kaisen Season 2/[SubsPlease] Jujutsu Kaisen - 28 (1080p) [D4AEE6A7].mkv",
        expected: {
            relativeEpisode: 3,
            mediaId: 100,
        },
    },
    {
        filename: "E:/ANIME/Mononogatari 2nd Season/[SubsPlease] Mononogatari - 13 (1080p) [914486BC].mkv",
        expected: {
            relativeEpisode: 3,
            mediaId: 100,
        },
    },
    {
        filename: "E:/ANIME/Mononogatari 2nd Season/[SubsPlease] Mononogatari - 14 (1080p) [701ECA16].mkv",
        expected: {
            relativeEpisode: 3,
            mediaId: 100,
        },
    },
    {
        filename: "E:/ANIME/Bungou Stray Dogs 5th Season/[SubsPlease] Bungou Stray Dogs - 51 (1080p) [0F36D6D2].mkv",
        expected: {
            relativeEpisode: 3,
            mediaId: 100,
        },
    },
    {
        filename: "E:/ANIME/Bungou Stray Dogs/[SubsPlease] Bungou Stray Dogs - 52 (1080p) [F609B947].mkv",
        expected: {
            relativeEpisode: 3,
            mediaId: 100,
        },
    },
    {
        filename: "E:/ANIME/Bungou Stray Dogs 5th Season/[SubsPlease] Bungou Stray Dogs - 61 (1080p) [F609B947].mkv",
        expected: {
            relativeEpisode: 3,
            mediaId: 100,
        },
    },
    {
        filename: "E:/ANIME/[SubsPlease] 86 - Eighty Six (01-23) (1080p) [Batch]/[SubsPlease] 86 - Eighty Six - 20v2 (1080p) [30072859].mkv",
        expected: {
            relativeEpisode: 3,
            mediaId: 100,
        },
    },
    {
        filename: "E:/ANIME/[SubsPlease] 86 - Eighty Six Part 2 [Batch]/[SubsPlease] 86 - Eighty Six - 21v2 (1080p) [30072859].mkv",
        expected: {
            relativeEpisode: 3,
            mediaId: 100,
        },
    },
    {
        filename: "E:/ANIME/[Judas] Golden Kamuy (Seasons 1-2) [BD 1080p][HEVC x265 10bit][Eng-Subs]/[Judas] Golden Kamuy - S2/[Judas] Golden Kamuy S2 - 13.mkv",
        expected: {
            relativeEpisode: 3,
            mediaId: 100,
        },
    },
    {
        filename: "E:/ANIME/[Judas] Golden Kamuy (Seasons 1-2) [BD 1080p][HEVC x265 10bit][Eng-Subs]/[Judas] Golden Kamuy - S2/[Judas] Golden Kamuy S2 - 14.mkv",
        expected: {
            relativeEpisode: 3,
            mediaId: 100,
        },
    },
    {
        filename: "E:/ANIME/[Judas] Golden Kamuy (Seasons 1-2) [BD 1080p][HEVC x265 10bit][Eng-Subs]/[Judas] Golden Kamuy/[Judas] Golden Kamuy - 15.mkv",
        expected: {
            relativeEpisode: 3,
            mediaId: 100,
        },
    },
]

export const __episodeNormalizationMatchingCases = [
    {
        media: __SampleMedia["86 - Eighty Six Season 1"],
        cases: [
            {
                path: "E:/ANIME/[SubsPlease] 86 - Eighty Six (01-23) (1080p) [Batch]/[SubsPlease] 86 - Eighty Six - 20v2 (1080p) [30072859].mkv",
                name: "[SubsPlease] 86 - Eighty Six - 20v2 (1080p) [30072859].mkv",
                expected: {
                    relativeEpisode: 9,
                    mediaId: 131586,
                },
            },
            {
                path: "E:/ANIME/[SubsPlease] 86 - Eighty Six Part 2 [Batch]/[SubsPlease] 86 - Eighty Six - 21v2 (1080p) [30072859].mkv",
                name: "[SubsPlease] 86 - Eighty Six - 21v2 (1080p) [30072859].mkv",
                expected: {
                    relativeEpisode: 10,
                    mediaId: 131586,
                },
            },
        ],
    },
    {
        media: __SampleMedia["86 - Eighty Six Season 2"],
        cases: [
            {
                path: "E:/ANIME/[SubsPlease] 86 - Eighty Six (01-23) (1080p) [Batch]/[SubsPlease] 86 - Eighty Six - 20v2 (1080p) [30072859].mkv",
                name: "[SubsPlease] 86 - Eighty Six - 20v2 (1080p) [30072859].mkv",
                expected: {
                    relativeEpisode: 9,
                    mediaId: 131586,
                },
            },
            {
                path: "E:/ANIME/[SubsPlease] 86 - Eighty Six Part 2 [Batch]/[SubsPlease] 86 - Eighty Six - 21v2 (1080p) [30072859].mkv",
                name: "[SubsPlease] 86 - Eighty Six - 21v2 (1080p) [30072859].mkv",
                expected: {
                    relativeEpisode: 10,
                    mediaId: 131586,
                },
            },
        ],
    },
    {
        media: __SampleMedia["Golden Kamuy Season 1"],
        cases: [
            {
                path: "E:/ANIME/[Judas] Golden Kamuy (Seasons 1-2) [BD 1080p][HEVC x265 10bit][Eng-Subs]/[Judas] Golden Kamuy/[Judas] Golden Kamuy - 13.mkv",
                name: "[Judas] Golden Kamuy - 13.mkv",
                expected: {
                    relativeEpisode: 1,
                    mediaId: 102977,
                },
            },
            {
                path: "E:/ANIME/[Judas] Golden Kamuy (Seasons 1-2) [BD 1080p][HEVC x265 10bit][Eng-Subs]/[Judas] Golden Kamuy/[Judas] Golden Kamuy - 14.mkv",
                name: "[Judas] Golden Kamuy - 14.mkv",
                expected: {
                    relativeEpisode: 2,
                    mediaId: 102977,
                },
            },
            {
                path: "E:/ANIME/[Judas] Golden Kamuy (Seasons 1-2) [BD 1080p][HEVC x265 10bit][Eng-Subs]/[Judas] Golden Kamuy/[Judas] Golden Kamuy - 15.mkv",
                name: "[Judas] Golden Kamuy - 15.mkv",
                expected: {
                    relativeEpisode: 3,
                    mediaId: 102977,
                },
            },
        ],
    },
    {
        media: __SampleMedia["Golden Kamuy Season 2"],
        cases: [
            {
                path: "E:/ANIME/[Judas] Golden Kamuy (Seasons 1-2) [BD 1080p][HEVC x265 10bit][Eng-Subs]/[Judas] Golden Kamuy - S2/[Judas] Golden Kamuy S2 - 13.mkv",
                name: "[Judas] Golden Kamuy S2 - 13.mkv",
                expected: {
                    relativeEpisode: 1,
                    mediaId: 102977,
                },
            },
            {
                path: "E:/ANIME/[Judas] Golden Kamuy (Seasons 1-2) [BD 1080p][HEVC x265 10bit][Eng-Subs]/[Judas] Golden Kamuy - S2/[Judas] Golden Kamuy S2 - 14.mkv",
                name: "[Judas] Golden Kamuy S2 - 14.mkv",
                expected: {
                    relativeEpisode: 2,
                    mediaId: 102977,
                },
            },
            { // Remove
                path: "E:/ANIME/[Judas] Golden Kamuy (Seasons 1-2) [BD 1080p][HEVC x265 10bit][Eng-Subs]/[Judas] Golden Kamuy - S2/[Judas] Golden Kamuy - 15.mkv",
                name: "[Judas] Golden Kamuy - 15.mkv",
                expected: {
                    relativeEpisode: 3,
                    mediaId: 102977,
                },
            },
        ],
    },
    {
        media: __SampleMedia["Mononogatari Season 1"],
        cases: [
            {
                path: "E:/ANIME/Mononogatari/[SubsPlease] Mononogatari - 13 (1080p) [914486BC].mkv",
                name: "[SubsPlease] Mononogatari - 13 (1080p) [914486BC].mkv",
                expected: {
                    relativeEpisode: 1,
                    mediaId: 163205,
                },
            },
            {
                path: "E:/ANIME/Mononogatari/[SubsPlease] Mononogatari - 14 (1080p) [701ECA16].mkv",
                name: "[SubsPlease] Mononogatari - 14 (1080p) [701ECA16].mkv",
                expected: {
                    relativeEpisode: 2,
                    mediaId: 163205,
                },
            },
        ],
    },
    {
        media: __SampleMedia["Mononogatari Season 2"],
        cases: [
            {
                path: "E:/ANIME/Mononogatari 2nd Season/[SubsPlease] Mononogatari - 13 (1080p) [914486BC].mkv",
                name: "[SubsPlease] Mononogatari - 13 (1080p) [914486BC].mkv",
                expected: {
                    relativeEpisode: 1,
                    mediaId: 163205,
                },
            },
            {
                path: "E:/ANIME/Mononogatari 2nd Season/[SubsPlease] Mononogatari - 14 (1080p) [701ECA16].mkv",
                name: "[SubsPlease] Mononogatari - 14 (1080p) [701ECA16].mkv",
                expected: {
                    relativeEpisode: 2,
                    mediaId: 163205,
                },
            },
        ],
    },
    {
        media: __SampleMedia["Jujutsu Kaisen Season 1"],
        cases: [
            {
                path: "E:/ANIME/Jujutsu Kaisen/[SubsPlease] Jujutsu Kaisen - 01 (1080p) [40737A9B].mkv",
                name: "[SubsPlease] Jujutsu Kaisen - 01 (1080p) [40737A9B].mkv",
                expected: {
                    relativeEpisode: 1,
                    mediaId: __SampleMedia["Jujutsu Kaisen Season 1"].id,
                },
            },
            {
                path: "E:/ANIME/Jujutsu Kaisen/[SubsPlease] Jujutsu Kaisen - 25 (1080p) [40737A9B].mkv",
                name: "[SubsPlease] Jujutsu Kaisen - 25 (1080p) [40737A9B].mkv",
                expected: {
                    relativeEpisode: 1,
                    mediaId: 145064,
                },
            },
            {
                path: "E:/ANIME/Jujutsu Kaisen/[SubsPlease] Jujutsu Kaisen - 26 (1080p) [B73D2DD3].mkv",
                name: "[SubsPlease] Jujutsu Kaisen - 26 (1080p) [B73D2DD3].mkv",
                expected: {
                    relativeEpisode: 2,
                    mediaId: 145064,
                },
            },
            {
                path: "E:/ANIME/Jujutsu Kaisen/[SubsPlease] Jujutsu Kaisen - 27 (1080p) [D4AEE6A7].mkv",
                name: "[SubsPlease] Jujutsu Kaisen - 27 (1080p) [D4AEE6A7].mkv",
                expected: {
                    relativeEpisode: 3,
                    mediaId: 145064,
                },
            },
        ],
    },
    {
        media: __SampleMedia["Jujutsu Kaisen Season 2"],
        cases: [
            {
                path: "E:/ANIME/Jujutsu Kaisen 2nd Season/[SubsPlease] Jujutsu Kaisen - 25 (1080p) [40737A9B].mkv",
                name: "[SubsPlease] Jujutsu Kaisen - 25 (1080p) [40737A9B].mkv",
                expected: {
                    relativeEpisode: 1,
                    mediaId: 145064,
                },
            },
            {
                path: "E:/ANIME/Jujutsu Kaisen 2nd Season/[SubsPlease] Jujutsu Kaisen - 26 (1080p) [B73D2DD3].mkv",
                name: "[SubsPlease] Jujutsu Kaisen - 26 (1080p) [B73D2DD3].mkv",
                expected: {
                    relativeEpisode: 2,
                    mediaId: 145064,
                },
            },
            {
                path: "E:/ANIME/Jujutsu Kaisen 2nd Season/[SubsPlease] Jujutsu Kaisen - 27 (1080p) [D4AEE6A7].mkv",
                name: "[SubsPlease] Jujutsu Kaisen - 27 (1080p) [D4AEE6A7].mkv",
                expected: {
                    relativeEpisode: 3,
                    mediaId: 145064,
                },
            },
            {
                path: "E:/ANIME/Jujutsu Kaisen/[SubsPlease] Jujutsu Kaisen - 25 (1080p) [40737A9B].mkv",
                name: "[SubsPlease] Jujutsu Kaisen - 25 (1080p) [40737A9B].mkv",
                expected: {
                    relativeEpisode: 1,
                    mediaId: 145064,
                },
            },
            {
                path: "E:/ANIME/Jujutsu Kaisen/[SubsPlease] Jujutsu Kaisen - 26 (1080p) [B73D2DD3].mkv",
                name: "[SubsPlease] Jujutsu Kaisen - 26 (1080p) [B73D2DD3].mkv",
                expected: {
                    relativeEpisode: 2,
                    mediaId: 145064,
                },
            },
            {
                path: "E:/ANIME/Jujutsu Kaisen/[SubsPlease] Jujutsu Kaisen - 27 (1080p) [D4AEE6A7].mkv",
                name: "[SubsPlease] Jujutsu Kaisen - 27 (1080p) [D4AEE6A7].mkv",
                expected: {
                    relativeEpisode: 3,
                    mediaId: 145064,
                },
            },
        ],
    },
    {
        media: __SampleMedia["Bungou Stray Dogs Season 1"],
        cases: [
            {
                path: "E:/ANIME/Bungou Stray Dogs/[SubsPlease] Bungou Stray Dogs - 51 (1080p) [0F36D6D2].mkv",
                name: "[SubsPlease] Bungou Stray Dogs - 51 (1080p) [0F36D6D2].mkv",
                expected: {
                    relativeEpisode: 1,
                    mediaId: 163263,
                },
            },
            {
                path: "E:/ANIME/Bungou Stray Dogs/[SubsPlease] Bungou Stray Dogs - 52 (1080p) [0F36D6D2].mkv",
                name: "[SubsPlease] Bungou Stray Dogs - 52 (1080p) [0F36D6D2].mkv",
                expected: {
                    relativeEpisode: 2,
                    mediaId: 163263,
                },
            },
            {
                path: "E:/ANIME/Bungou Stray Dogs 5th Season/[SubsPlease] Bungou Stray Dogs - 51 (1080p) [0F36D6D2].mkv",
                name: "[SubsPlease] Bungou Stray Dogs - 51 (1080p) [0F36D6D2].mkv",
                expected: {
                    relativeEpisode: 1,
                    mediaId: 163263,
                },
            },
            {
                path: "E:/ANIME/Bungou Stray Dogs 5th Season/[SubsPlease] Bungou Stray Dogs - 52 (1080p) [0F36D6D2].mkv",
                name: "[SubsPlease] Bungou Stray Dogs - 52 (1080p) [0F36D6D2].mkv",
                expected: {
                    relativeEpisode: 2,
                    mediaId: 163263,
                },
            },
        ],
    },
    {
        media: __SampleMedia["Bungou Stray Dogs Season 1"],
        cases: [
            {
                path: "E:/ANIME/Bungou Stray Dogs/[SubsPlease] Bungou Stray Dogs - 38 (1080p) [0F36D6D2].mkv",
                name: "[SubsPlease] Bungou Stray Dogs - 38 (1080p) [0F36D6D2].mkv",
                expected: {
                    relativeEpisode: 1,
                    mediaId: __SampleMedia["Bungou Stray Dogs Season 4"].id,
                },
            },
            {
                path: "E:/ANIME/Bungou Stray Dogs/[SubsPlease] Bungou Stray Dogs - 50 (1080p) [0F36D6D2].mkv",
                name: "[SubsPlease] Bungou Stray Dogs - 50 (1080p) [0F36D6D2].mkv",
                expected: {
                    relativeEpisode: 13,
                    mediaId: __SampleMedia["Bungou Stray Dogs Season 4"].id,
                },
            },
        ],
    },
    {
        media: __SampleMedia["Bungou Stray Dogs Season 4"],
        cases: [
            {
                path: "E:/ANIME/Bungou Stray Dogs 4th Season/[SubsPlease] Bungou Stray Dogs - 38 (1080p) [0F36D6D2].mkv",
                name: "[SubsPlease] Bungou Stray Dogs - 38 (1080p) [0F36D6D2].mkv",
                expected: {
                    relativeEpisode: 1,
                    mediaId: __SampleMedia["Bungou Stray Dogs Season 4"].id,
                },
            },
            {
                path: "E:/ANIME/Bungou Stray Dogs 4th Season/[SubsPlease] Bungou Stray Dogs - 50 (1080p) [0F36D6D2].mkv",
                name: "[SubsPlease] Bungou Stray Dogs - 50 (1080p) [0F36D6D2].mkv",
                expected: {
                    relativeEpisode: 13,
                    mediaId: __SampleMedia["Bungou Stray Dogs Season 4"].id,
                },
            },
        ],
    },
    {
        media: __SampleMedia["Bungou Stray Dogs Season 4"],
        cases: [
            {
                path: "E:/ANIME/Bungou Stray Dogs 5th Season/[SubsPlease] Bungou Stray Dogs - 51 (1080p) [0F36D6D2].mkv",
                name: "[SubsPlease] Bungou Stray Dogs S5 - 51 (1080p) [0F36D6D2].mkv",
                expected: {
                    relativeEpisode: 1,
                    mediaId: 163263,
                },
            },
            {
                path: "E:/ANIME/Bungou Stray Dogs 5th Season/[SubsPlease] Bungou Stray Dogs - 52 (1080p) [0F36D6D2].mkv",
                name: "[SubsPlease] Bungou Stray Dogs S5 - 52 (1080p) [0F36D6D2].mkv",
                expected: {
                    relativeEpisode: 2,
                    mediaId: 163263,
                },
            },
            {
                path: "E:/ANIME/Bungou Stray Dogs 5th Season/[SubsPlease] Bungou Stray Dogs - 51 (1080p) [0F36D6D2].mkv",
                name: "[SubsPlease] Bungou Stray Dogs S5 - 51 (1080p) [0F36D6D2].mkv",
                expected: {
                    relativeEpisode: 1,
                    mediaId: 163263,
                },
            },
            {
                path: "E:/ANIME/Bungou Stray Dogs 5th Season/[SubsPlease] Bungou Stray Dogs - 52 (1080p) [0F36D6D2].mkv",
                name: "[SubsPlease] Bungou Stray Dogs S5 - 52 (1080p) [0F36D6D2].mkv",
                expected: {
                    relativeEpisode: 2,
                    mediaId: 163263,
                },
            },
        ],
    },
    {
        media: __SampleMedia["Bungou Stray Dogs Season 5"],
        cases: [
            {
                path: "E:/ANIME/Bungou Stray Dogs 5th Season/[SubsPlease] Bungou Stray Dogs - 51 (1080p) [0F36D6D2].mkv",
                name: "[SubsPlease] Bungou Stray Dogs - 51 (1080p) [0F36D6D2].mkv",
                expected: {
                    relativeEpisode: 1,
                    mediaId: 163263,
                },
            },
            {
                path: "E:/ANIME/Bungou Stray Dogs 5th Season/[SubsPlease] Bungou Stray Dogs - 52 (1080p) [0F36D6D2].mkv",
                name: "[SubsPlease] Bungou Stray Dogs - 52 (1080p) [0F36D6D2].mkv",
                expected: {
                    relativeEpisode: 2,
                    mediaId: 163263,
                },
            },
            {
                path: "E:/ANIME/Bungou Stray Dogs/[SubsPlease] Bungou Stray Dogs - 51 (1080p) [0F36D6D2].mkv",
                name: "[SubsPlease] Bungou Stray Dogs - 51 (1080p) [0F36D6D2].mkv",
                expected: {
                    relativeEpisode: 1,
                    mediaId: 163263,
                },
            },
            {
                path: "E:/ANIME/Bungou Stray Dogs/[SubsPlease] Bungou Stray Dogs - 52 (1080p) [0F36D6D2].mkv",
                name: "[SubsPlease] Bungou Stray Dogs - 52 (1080p) [0F36D6D2].mkv",
                expected: {
                    relativeEpisode: 2,
                    mediaId: 163263,
                },
            },
        ],
    },
]
