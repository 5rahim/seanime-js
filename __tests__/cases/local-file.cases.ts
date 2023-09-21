import { __SampleMedia } from "../samples/media.sample"
import { __SampleLocalFiles } from "../samples/local-file.sample"

export default {
    "createLocalFile": Object.values(__SampleLocalFiles).map(file => ({
        initialProps: { path: file.path, name: file.name },
        expected: file,
    })),
    "initialMetadata": [
        /**
         * Movies with no parsed episode
         */
        {
            localFile: __SampleLocalFiles["One Piece Film Gold"],
            media: __SampleMedia["One Piece Film Gold"],
            expected: {
                metadata: {
                    episode: 1,
                    aniDBEpisodeNumber: "1",
                    isSpecial: undefined,
                    isNC: undefined,
                },
                mediaId: null,
            },
        },
        {
            localFile: __SampleLocalFiles["Blue Lock Season 1 Episode 1"],
            media: __SampleMedia["Blue Lock Season 1"],
            expected: {
                metadata: {
                    episode: 1,
                    aniDBEpisodeNumber: "1",
                    isSpecial: undefined,
                    isNC: undefined,
                },
                mediaId: null,
            },
        },
        /**
         * Test episode normalization when [LocalFile] is matched to incorrect season
         */
        {
            localFile: __SampleLocalFiles["Mononogatari Season 2 Episode 1 (Episode 13)"],
            media: __SampleMedia["Mononogatari Season 1"], // Incorrect season match
            expected: {
                metadata: {
                    episode: 1,
                    aniDBEpisodeNumber: "1",
                    isSpecial: undefined,
                    isNC: undefined,
                },
                mediaId: __SampleMedia["Mononogatari Season 2"].id, // Expect to be overridden with correct season
            },
        },
        {
            localFile: __SampleLocalFiles["Bungou Stray Dogs Season 5 Episode 1 (Episode 51)"],
            media: __SampleMedia["Bungou Stray Dogs Season 1"], // Incorrect season match
            expected: {
                metadata: {
                    episode: 1,
                    aniDBEpisodeNumber: "1",
                    isSpecial: undefined,
                    isNC: undefined,
                },
                mediaId: __SampleMedia["Bungou Stray Dogs Season 5"].id, // Expect to be overridden with correct season
            },
        },
        {
            localFile: __SampleLocalFiles["Bungou Stray Dogs Season 5 Episode 2 (Episode 52)"],
            media: __SampleMedia["Bungou Stray Dogs Season 1"], // Incorrect season match
            expected: {
                metadata: {
                    episode: 2,
                    aniDBEpisodeNumber: "2",
                    isSpecial: undefined,
                    isNC: undefined,
                },
                mediaId: __SampleMedia["Bungou Stray Dogs Season 5"].id, // Expect to be overridden with correct season
            },
        },
        /**
         * Correct season match but absolute episode number
         */
        {
            localFile: __SampleLocalFiles["Bungou Stray Dogs Season 5 Episode 2 (Episode 52)"],
            media: __SampleMedia["Bungou Stray Dogs Season 5"], // Correct season match
            expected: {
                metadata: {
                    episode: 2,
                    aniDBEpisodeNumber: "2",
                    isSpecial: undefined,
                    isNC: undefined,
                },
                mediaId: __SampleMedia["Bungou Stray Dogs Season 5"].id, // Expect to be overridden with correct season
            },
        },
        {
            localFile: __SampleLocalFiles["86 - Eighty Six Season 2 Episode 1 (Episode 20)"],
            media: __SampleMedia["86 - Eighty Six Season 1"], // Incorrect season match
            expected: {
                metadata: {
                    episode: 9,
                    aniDBEpisodeNumber: "9",
                    isSpecial: undefined,
                    isNC: undefined,
                },
                mediaId: __SampleMedia["86 - Eighty Six Season 2"].id, // Expect to be overridden with correct season
            },
        },
        {
            localFile: __SampleLocalFiles["86 - Eighty Six Season 2 Episode 2 (Episode 21)"],
            media: __SampleMedia["86 - Eighty Six Season 2"], // Correct season match
            expected: {
                metadata: {
                    episode: 10,
                    aniDBEpisodeNumber: "10",
                    isSpecial: undefined,
                    isNC: undefined,
                },
                mediaId: __SampleMedia["86 - Eighty Six Season 2"].id, // No overriding since it is the right season
            },
        },
        {
            localFile: __SampleLocalFiles["Golden Kamuy Season 2 Episode 2 (Episode 14)"],
            media: __SampleMedia["Golden Kamuy Season 2"], // Correct season match
            expected: {
                metadata: {
                    episode: 2,
                    aniDBEpisodeNumber: "2",
                    isSpecial: undefined,
                    isNC: undefined,
                },
                mediaId: __SampleMedia["Golden Kamuy Season 2"].id, // No overriding since it is the right season
            },
        },
    ],
}
