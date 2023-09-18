/**
 * Torrent metadata
 */
export default {
    // Metadata
    data: [
        /(?<remux>\bREMUX(?:ES)?\b)/,
        /(?<remux>\b[Rr]emux(?:es)?\b)/,
        /(?<remastered>\bRemastered\b)/,
        /(?<complete>\[[Cc]omplete\])/,
        /(?<complete>COMPLETE)/,
        /(?<weekly>[(\[]Weekly[)\]])/i,
        /(?<complete>Complete (?:[Ss]eries)?)/,
        /(?<complete>Complete$)/,
        /(?<high_quality>\b[Hh]igh [Qq]uality\b)/,
        /(?<batch>\bBatch\b)/,
        /(?<extended>\bEXTENDED\b)/,
        /(?<pack>\bCoffret\b)/,
        /(?<v2>\b[Vv]2\b)/,
        /(?<high_quality>\bHQ\b)/i,
        /[+]\s?(?<has_ovas>OVAs?)/,
        /[+]\s?(?<has_specials>Specials?)/,
        /(?<has_specials>[Oo]ne [Ss]pecials?)/,
        /(?<has_specials>[Tt]wo [Ss]pecials?)/,
        /(?<has_specials>[Tt]hree [Ss]pecials?)/,
        /(?<has_specials>[Ff]our [Ss]pecials?)/,
        /(?<has_specials>[Ff]ive [Ss]pecials?)/,
        /(?<has_specials>[Ss]ix [Ss]pecials?)/,
    ],
    episodeTitle: [
        // `S01E1 - Episode title`
        // /(^|\b|[_-])?(?:S\d+E\d{1,3}) ?-? ?(?<episodeTitle>[a-zA-Z _'`,.…!?()\d-]+)(?: |$)/
        /(^|\b|[_-])?S\d+E\d{1,3} ?[ -] ?(?<episodeTitle>[a-zA-Z].*)(?: |$)/,
        /(^|\b|[_-])?E\d{1,4} ?[ -] ?(?<episodeTitle>[a-zA-Z].*)(?: |$)/,
        /^\d{2,4} ?[ -] ?(?<episodeTitle>[a-zA-Z].*)(?: |$)/,
        /- \d{1,4} [ -] (?<episodeTitle>[a-zA-Z].*)(?: |$)/,
    ],
    releaseGroup: [
        // Brackets with normal phrasing, and no specials characters is probably releaseGroup name
        /\[(?<releaseGroup>[A-Za-z][-A-Za-z&! 0-9.]{5,})\]/,
        // releaseGroup is usually at start of filename
        /^\[(?<releaseGroup>[^\]]+[-A-Za-z&! 0-9.]{2,})\]/,
        /^\[(?<releaseGroup>[-A-Za-z&! 0-9.]+)\]/,
        // releaseGroup at end of filename, with special characters but got "Sub" in its name
        /\s(?<releaseGroup>[A-Za-z][-A-Za-z&!0-9.]+[Ss][Uu][Bb])$/,
        // releaseGroup at end of filename
        /(?<!\d)-(?<releaseGroup>[A-Za-z][A-Za-z&!0-9.]+)$/,
    ],
    website: [
        /\[(?<website>[\w]+\.(?:com))\]/,
    ],

}
