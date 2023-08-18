/**
 * Serie related regexs
 */
export default {

    //Episode
    episode: {
        //Episodes ranges
        range: {
            extract: [
                /\b[-._ ]?[Vv]ol[-._ ]?(?<a>\d+)-(?<b>\d+)\b/,
                /[Ee][Pp][Ss]?\.? (?<a>\d{2,})-(?<b>\d{2,})/,
                /E(?<a>\d{2,})-E(?<b>\d{2,})/,
                /(?<a>\d{2,}) ~ (?<b>\d{2,})/,
                /[Ee]pisodio\s(?<a>\d+)\s?[-~&]\s?(?<b>\d+)/,
            ],
            keep: [
                /(?<!\d)(?<a>\d{1,3})\s?[-~&]\s?(?<b>\d{1,3})/,
            ],
        },
        //Single episode
        single: {
            extract: [
                /(?<episode>\d{2,})\s+END(?: |$)/,
                /#(?<episode>\d+)(?: |$)/,
                /\s(?<episode>0\d+)'(?: |$)/, // 01'
                /\s(?<episode>\d+)'(?: |$)/, // 1234'
                /\s(?<episode>\d+)[.v](\d{0,2})(?: |$)/, // ` 01v2` `01v2 `
                /(?<=[a-zA-Z])\s(?<episode>\d+)\s(?=[a-zA-Z])/, // KEEP `Mieruko-chan [10] She sees`
            ],
            keep: [
                /\bS\d+E(?<episode>\d+)\b/,
                /\bE(?<episode>0\d+)\b/,
                /\bE(?<episode>\d{2,3})\b/,
                /\b(?<episode>0\d+)\b/,
                /\s(?<episode>0\d+)$/,
                /- \b(?<episode>\d+)(?= |$)\b/, // KEEP `This - 01 - [02]`, NOT `Not this - 01 Text here`
                // /\s(?<episode>0\d+)[.v](?<version>\d{0,2})?(?: |$)/,
                // /\s(?<episode>\d{1,3})[.v](?<version>\d{0,2})?(?: |$)/,
            ],
        },
        // Version
        version: {
            extract: [],
            keep: [
                // /[.vx'](?<episode>\d{0,2})?(?: |$)/
            ],
        },
    },

    //Movie
    movie: {
        range: {
            extract: [
                /[Mm]ovies?\s(?<a>\d+)\s?[-~&]\s?(?<b>\d+)/,
            ],
            keep: [],
        },
        single: {
            extract: [
                /(?<=[Mm]ovie\s)(?<movie>\d+)/,
            ],
            keep: [],
        },
    },

    //Part
    part: {
        range: {
            extract: [],
            keep: [],
        },
        single: {
            extract: [
                /\b[Pp]art[-._ ](?<part>\d)\b/,
            ],
            keep: [],
        },
    },

    //Season
    season: {
        range: {
            extract: [
                // /\b[\(\[)]?[Ss]easons (?<a>\d+)\s?[-~&]\s?(?<b>\d+)[\)\]]?\b/,
                /**
                 * Fruits Basket `S01-S03`+Movie 1080p Dual Audio BDRip 10 bits DD x265-EMBER
                 * Fruits Basket `Seasons 1-12`
                 * Fruits Basket `Seasons 1-45`+Movie
                 * Fruits Basket `Season 1-45`
                 * Fruits Basket `S2-S1`
                 * Test `S01-04` Text
                 * Golden Kamuy S1 - 04 <-- Nope
                 */
                /\b[(\[)]?[Ss](eason)?s? ?S?(?<a>0?\d+)[-~&]S?(?<b>0?\d+)[)\]]?\b/,
            ],
            keep: [],
        },
        single: {
            extract: [
                /\b(?<season>1)st [Ss]eason\b/,
                /\b(?<season>2)nd [Ss]eason\b/,
                /\b(?<season>3)rd [Ss]eason\b/,
                /\b(?<season>4)th [Ss]eason\b/,
                /\b(?<season>5)th [Ss]eason\b/,
                /\b(?<season>6)th [Ss]eason\b/,
                /\b(?<season>7)th [Ss]eason\b/,
                /\b(?<season>8)th [Ss]eason\b/,
                /\b(?<season>9)th [Ss]eason\b/,
                /\b(?<season>10)th [Ss]eason\b/,
                /\b[\(\[)]?[Ss]eason (?<season>\d+)[\)\]]?\b/,
                /\b[\(\[)]?[Ss]aison (?<season>\d+)[\)\]]?\b/,

                /[-._ ][Ss](?<season>\d+)(?=[Ee]\d)/,
                /\b[Ss](?<season>\d+)\b/,
                /^[Ss](?<season>\d+)(?=[(E\d) _-])/,
            ],
            keep: [],
        },
    },

}
