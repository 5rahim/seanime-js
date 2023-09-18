//Imports
import * as Regexes from "./regexes"

/**
 * Rakun
 * Anime Torrent Name Parser.
 */
export default abstract class Parser {

    /**
     * Regexes.
     */
    private static readonly regexes = Regexes
    /**
     * Processors.
     */
    private static readonly process = Object.freeze({

        /**
         * Main processors
         */
        main(data: TorrentParserData, ...args: {
            key?: string,
            collection?: RegExp[],
            get?: "key" | "value",
            mode?: "append" | "replace" | "skip",
            clean?: boolean,
            cleaners?: RegExp[]
        }[]) {
            //Initialization
            const { result, removes, options } = data
            let { cleaned } = data
            //Loop over arguments
            for (const {
                key = "",
                collection = [],
                get = "key",
                mode = "append",
                clean = true,
                cleaners = []
            } of args) {
                //Parse key
                if (key) {
                    //Search for matches
                    //console.debug(`${key} > process`)
                    let matches = Parser.test({ collection, value: cleaned, get })

                    if (matches.length) {
                        //Retrieve group names (or values) and remove leading underscore
                        //console.debug(`${key} > process > ${matches.length} regex matches`)
                        const { [key]: previous = "" } = result
                        //Evaluate mode
                        //console.debug(`${key} > process > mode ${mode}`)
                        switch (mode) {
                            case "append": {
                                result[key] = [...new Set([...previous.split(" "), ...matches.matches.flat()].sort())].join(" ")
                                break
                            }
                            case "replace": {
                                result[key] = [...new Set(matches.matches.flat())].join(" ")
                                break
                            }
                            case "skip": {
                                if (result[key]) {
                                    // console.debug(`${key} > process > mode skip > value already defined, skipping`)
                                    continue
                                }
                                result[key] = matches.matches[0].join(" ")
                                break
                            }
                        }
                        if (key !== "episodeTitle") {
                            removes.push(...matches.regexes)
                        } else {
                            const match = cleaned.match(matches.regexes[0])
                            const episodeTitle = match?.groups?.episodeTitle
                            if (episodeTitle) {
                                cleaned = cleaned.replace(episodeTitle, "")
                            }
                        }
                        //Put matching regex in queue for removal
                    }
                    //No matches
                    else {
                    }
                    //console.debug(`${key} > process > no matches`)

                }
                //Clean if needed
                if (clean) {
                    cleaned = Parser.clean({ value: cleaned, removes: [...removes, ...cleaners] })
                    //console.debug(`${key || "(meta)"} > process > cleaned value = ${cleaned}`)
                    removes.splice(0)
                }
            }
            //Register name
            result.name = cleaned
            //console.debug(`name > process > current value = ${cleaned}`)
        },

        /**
         * Post-processors.
         */
        post: Object.freeze({

            /**
             * Clean all properties (except filename).
             */
            clean(data: TorrentParserData) {
                //Initialization
                const { result, removes, options } = data
                //Clean all properties
                for (const [key, value] of Object.entries(result)) {
                    //Clean
                    result[key] = (value === result.filename) ? value : Parser.clean({ value, removes })
                    //Delete property if empty
                    if (!result[key]) {
                        //console.debug(`${key} > post-process > deleted because empty`)
                        delete result[key]
                    }
                }
            },

            /**
             * Post-processing for codecs.
             */
            codecs(data: TorrentParserData) {
                //Initialization
                const { result, regexes } = data
                let { codecs } = result
                //Check if codecs exists
                if (codecs) {
                    //If codecs includes both DTS and DTS HDMA, only keep latter version
                    for (const [duplicates, kept] of regexes.processors.post.codecs.duplicates) {
                        if (duplicates.map((regex: RegExp) => regex.test(codecs)).filter((match: boolean) => match).length === duplicates.length) {
                            codecs = [...Parser.clean({
                                value: codecs,
                                removes: duplicates,
                            }).split(" "), kept].sort().join(" ")
                            //console.debug(`codecs > post-process > found duplicate codecs for ${kept}`)
                        }
                    }
                    //console.debug(`codecs > post-process > current codecs = ${codecs}`)
                    result.codecs = codecs
                }
            },

            /**
             * Post-processing for name.
             */
            name(data: TorrentParserData) {
                //Initialization
                const { result, rejects, regexes } = data
                //Reverse string (used to make regex starts from end instead of start)
                let value = [...`${result.name} ${rejects.join(" ")}`].reverse().map(c => ({
                    "[": "]",
                    "]": "[",
                } as RakunRecordAny)[c] || c).join("").trim()
                //Remove unparsable attributes
                while (regexes.cleaners.special.unparsable.test(value)) {
                    //Edge case : title is in brackets
                    if (regexes.cleaners.special.only_brackets.test(value)) {
                        //console.debug(`name > post-process > last attribute, assuming it is name`)
                        value = value.match(regexes.cleaners.special.only_brackets)?.groups?.name as string
                        break
                    }
                    //Edge case : no releaseGroup has been detected yet but attribute is candidate for it
                    else if ((!result.releaseGroup) && (regexes.processors.post.releaseGroup.possible_releaseGroup_name.test(value))) {
                        result.releaseGroup = [...value.match(regexes.processors.post.releaseGroup.possible_releaseGroup_name)?.groups?.releaseGroup as string].reverse().join("")
                        //console.debug(`name > post-process > found unparsable value which may be releaseGroup (${result.releaseGroup})`)
                    }
                    //Remove unparsable brackets
                    else
                        //console.debug(`name > post-process > found unparsable value ${value.match(regexes.cleaners.special.unparsable)?.groups?.unparsable}`)
                        value = Parser.clean({
                            value,
                            removes: [regexes.cleaners.special.unparsable],
                            empty: { parenthesis: false },
                        })
                }
                //Re-reverse string
                value = [...value].reverse().join("")

                //Post-processor name refiners
                {
                    //If audio is not defined or doesn't include multi but post processor test is positive
                    if (((!result.audio) || (!result.audio.includes("multi"))) && (regexes.processors.post.audio.possible_multi_audio.test(value))) {
                        result.audio = [...new Set([...(result.audio || "").split(" "), "multi"].sort())].join(" ")
                        //console.debug(`audio > post-process > current value = ${result.audio}`)
                        value = Parser.clean({ value, removes: [regexes.processors.post.audio.possible_multi_audio] })
                    }
                    //If episode is not defined, we may be able to find it
                    if ((!result.episode) && (regexes.processors.post.series.possible_episode.test(value))) {
                        result.episode = value.match(regexes.processors.post.series.possible_episode)?.groups?.episode
                        //console.debug(`episode > post-process > current value = ${result.episode}`)
                        value = Parser.clean({ value, removes: [regexes.processors.post.series.possible_episode] })
                    }
                    if (!result.episode) { // If episode is not defined but title contains "1_5" -> Episode 1
                        const matches = value.match(/\b[(\[)]?(?<a>0?\d+)_(?<b>0?\d+)[)\]]?\b/)
                        const a = matches?.groups?.a
                        if (a) {
                            if ((Number(a)) || ((regexes.processors.post.series.leading_zero.test(a)))) {
                                result["episode"] = Number(a).toString()
                                value = Parser.clean({
                                    value,
                                    removes: [/\b[(\[)]?(?<a>0?\d+)_(?<b>0?\d+)[)\]]?\b/],
                                })
                            }
                        }
                    }
                    if (!result.episode) { // If episode is not defined but title contains "S1_5" or "S1_E5" -> Season 1, Episode 5
                        const rx = /[-._ ][Ss](?<a>\d+)_E?(?<b>\d+)/
                        const matches = value.match(rx)
                        const a = matches?.groups?.a
                        const b = matches?.groups?.b
                        if (a && b) {
                            if ((Number(a)) || ((regexes.processors.post.series.leading_zero.test(a)))) {
                                if ((Number(b)) || ((regexes.processors.post.series.leading_zero.test(b)))) {
                                    if (!result.season) {
                                        result["season"] = Number(a).toString()
                                    }
                                    result["episode"] = Number(b).toString()
                                    value = Parser.clean({
                                        value,
                                        removes: [rx],
                                    })
                                }
                            }
                        }
                    }
                    if (!result.episode) { // If episode is not defined but title contains "01x02" or "1x2" -> Season 1, Episode 2
                        const rx = /\b[(\[)]?S?(?<a>0?\d+)xE?(?<b>0?\d+)[)\]]?\b/
                        const matches = value.match(rx)
                        const a = matches?.groups?.a
                        const b = matches?.groups?.b
                        if (a && b) {
                            if ((Number(a)) || ((regexes.processors.post.series.leading_zero.test(a)))) {
                                if ((Number(b)) || ((regexes.processors.post.series.leading_zero.test(b)))) {
                                    if (!result.season) {
                                        result["season"] = Number(a).toString()
                                    }
                                    result["episode"] = Number(b).toString()
                                    value = Parser.clean({
                                        value,
                                        removes: [rx],
                                    })
                                }
                            }
                        }
                    }

                    // Trying to account for titles like "Zoom 100" "Mob Psycho 100"
                    const matches = value.match(/- (?<episode>0\d+)(?: |$)/)
                    if (matches?.groups?.episode) {
                        result["episode"] = Number(matches.groups.episode).toString()
                        value = Parser.clean({
                            value,
                            removes: [/- (?<episode>0\d+)(?: |$)/],
                        })
                    }

                    if (!result.episode) {
                        const matches = value.match(/(?<=[a-zA-Z]) \b(?<episode>\d{2})\b (?=[a-zA-Z]+)/)
                        if (matches?.groups?.episode) {
                            result["episode"] = Number(matches.groups.episode).toString()
                            value = Parser.clean({
                                value,
                                removes: [/(?<=[a-zA-Z]) \b(?<episode>\d{2})\b (?=[a-zA-Z]+)/],
                            })
                        }
                    }
                }

                // Remove leftover episode titles
                // eg: Cowboy Bebop - - Stray dog strut -> Cowboy Bebop
                // value = value.replace(/\s?-\s?-\s?(.*)(?: |$)/g, "")
                // Remove leftover movie mention
                // eg: Cowboy Bebop +Movie
                value = value.replace(/[+_-][Mm]ovies?/g, "")

                //Replace special characters with spaces if needed
                for (const regex of [...regexes.processors.post.name.special_to_space, ...regexes.processors.post.name.isolated])
                    value = value.replace(regex, " ")

                // console.debug(`name > post-process > current value = ${value}`)
                result.name = value
            },

            /**
             * Post-processing for resolution.
             */
            resolution(data: TorrentParserData) {
                //Initialization
                const { result, regexes } = data
                let { name, resolution } = result
                //Check if resolution does not exist
                if (!resolution) {
                    //If resolution has not been found, maybe one of the number is actually a resolution value
                    const matches = Parser.test({
                        collection: regexes.processors.post.resolution.possible_resolution,
                        value: name,
                    })
                    if (matches.length) {
                        //Extract match
                        const match = matches.matches[0].join(" ")
                        const regex = matches.regexes[0]
                        resolution = match
                        //Clean
                        result.name = Parser.clean({ value: name, removes: [regex] })
                        //Update resolution
                        //console.debug(`resolution > post-process > found remaining number which may be resolution (${match})`)
                        //console.debug(`resolution > post-process > current resolution = ${resolution}`)
                        result.resolution = resolution
                    }
                }
            },

            /**
             * Post-processing for season, episode and part.
             */
            series(data: TorrentParserData) {
                //Initialization
                const { result, rejects, regexes } = data
                //Iterate on move, season, episode and part properties
                for (const key of ["movie", "season", "episode", "part"]) {
                    //Remove leading zeros
                    let value = result[key]
                    if (value) {
                        //Detect ranges
                        // if (regexes.processors.post.series.range.test(value)) {
                        // const [a, b] = value.trim().split(" ")
                        // //If range is not ascending or upper limit has leading zero while lower hasn't, lower limit is probably not part of a range
                        // if ((Number(a) > Number(b)) || ((regexes.processors.post.series.leading_zero.test(b)) && (!regexes.processors.post.series.leading_zero.test(a)))) {
                        //     //console.debug(`${key} > post-process > invalid range or formatting mismatch, accepting ${b} but rejecting ${a}`)
                        //     value = Number(b).toString()
                        //     rejects.push(a)
                        // } else
                        //     value = [a, b].map(Number).join("-")
                        // }
                        //Detect single
                        // else
                        if (regexes.processors.post.series.single.test(value)) {// eg: 5
                            value = Number(value).toString()
                        } else if (regexes.processors.post.series.versioned.test(value)) { // eg: 5 2
                            const [a, b] = value.trim().split(/\s+/)
                            if (a && b) { // eg: 01 03
                                if ((Number(a)) || ((regexes.processors.post.series.leading_zero.test(a)))) {
                                    value = Number(a).toString()
                                }
                            }
                        }
                        //console.debug(`${key} > post-process > current ${key} = ${value}`)
                        result[key] = value
                    }
                }
            },

        }),
        /**
         * Pre-processors.
         */
        pre: Object.freeze({

            /**
             * Extract and locate asian content.
             */
            asian_content(data: TorrentParserData) {
                //Initialization
                const { regexes } = data
                let { cleaned } = data
                //Iterate on asian content regexes
                for (const regex of regexes.processors.pre.name.asian_content)
                    cleaned = cleaned.replace(regex, "$<content>")
                //console.debug(`(meta) > pre-process > cleaned value = ${cleaned}`)
                data.cleaned = cleaned
            },

        }),
    })

    /**
     * Parse filename.
     */
    public static parse(filename: string, options: RakunParserOptions = {}) {
        //Preparation
        const regexes = Parser.regexes
        const data = {
            result: { filename: filename.trim() },
            cleaned: filename.trim(),
            removes: [],
            rejects: [],
            regexes,
            options,
        } as TorrentParserData
        //Pre-processing
        this.process.pre.asian_content(data)
        //Main processing
        this.process.main(data,
            { key: "hash", collection: regexes.file.hash, get: "value" },
            { key: "website", collection: regexes.meta.website, get: "value" },
            { key: "extension", collection: regexes.file.extension },
            { key: "resolution", collection: regexes.quality.resolution },
            { key: "codecs", collection: regexes.quality.codecs },
            { key: "source", collection: regexes.quality.source },
            { key: "distributor", collection: regexes.quality.distributor },
            { key: "meta", collection: regexes.meta.data },
            { key: "audio", collection: regexes.lang.audio.extract },
            { key: "audio", collection: regexes.lang.audio.keep, clean: false },
            { key: "subtitles", collection: regexes.lang.subtitles.extract },
            { key: "subtitles", collection: regexes.lang.subtitles.keep, clean: false },
            { key: "releaseGroup", collection: regexes.meta.releaseGroup, get: "value", mode: "skip" },
            {
                key: "episodeTitle", collection: regexes.meta.episodeTitle,
                get: "value",
                clean: false,
            },

            { key: "movie", collection: regexes.series.movie.range.extract, get: "value" },
            { key: "movie", collection: regexes.series.movie.single.extract, get: "value" },
            { key: "movie", collection: regexes.series.movie.range.keep, get: "value", mode: "skip" },
            { key: "movie", collection: regexes.series.movie.single.keep, get: "value", mode: "skip" },

            { key: "partRange", collection: regexes.series.part.range.extract, get: "value" },
            { key: "part", collection: regexes.series.part.single.extract, get: "value" },
            { key: "partRange", collection: regexes.series.part.range.keep, get: "value", mode: "skip" },
            { key: "part", collection: regexes.series.part.single.keep, get: "value", mode: "skip" },

            // NEW cour
            { key: "cour", collection: regexes.series.cour.single.extract, get: "value" },

            { key: "seasonRange", collection: regexes.series.season.range.extract, get: "value" },
            { key: "season", collection: regexes.series.season.single.extract, get: "value" },
            {
                key: "seasonRange",
                collection: regexes.series.season.range.keep,
                get: "value",
                clean: false,
                mode: "skip",
            },
            { key: "season", collection: regexes.series.season.single.keep, get: "value", clean: false, mode: "skip" },

            { key: "episodeRange", collection: regexes.series.episode.range.extract, get: "value" },
            { key: "episode", collection: regexes.series.episode.single.extract, get: "value" },
            {
                key: "episodeRange",
                collection: regexes.series.episode.range.keep,
                get: "value",
                clean: false,
                mode: "skip",
            },
            {
                key: "episode",
                collection: regexes.series.episode.single.keep,
                get: "value",
                clean: false,
                mode: "skip",
            },
            { key: "meta", collection: regexes.meta.data },
            { cleaners: regexes.cleaners.misc },
        )
        //Post-processing
        this.process.post.series(data)
        this.process.post.codecs(data)
        this.process.post.resolution(data)
        this.process.post.name(data)
        this.process.post.clean(data)
        return data.result as ParsedTorrentInfo
    }

    /**
     * Test a collection of regex on a value and return all matching regex with its captured groups.
     */
    private static test({ value, collection, get = "key" }: {
        value: string,
        collection: RegExp[],
        get?: "key" | "value"
    }): { length: number, matches: any[][], regexes: RegExp[] } {
        //Evaluate regex from collection and filter matching ones
        const matches = collection
            .map(regex => regex.test(value) ? { match: value.match(regex)?.groups, regex } : null)
            .filter((match): match is  { match: RakunRecordAny, regex: RegExp } => !!match)
        //Groups matches and regexes
        return {
            length: matches.length,
            regexes: matches.map(({ regex }) => regex),
            matches: matches.map(({ match }) => [...Object.entries(match)].filter(([key, val]) => val).map(([key, val]) => get === "key" ? key.replace(/^_/, "") : val)),
        }
    }

    /**
     * Clean string with given regex, apply cleaners and trim.
     */
    private static clean({ value, removes = [], empty = {} }: {
        value: string,
        removes?: RegExp[],
        empty?: { parenthesis?: boolean }
    }): string {
        //Preparation
        const { parenthesis = true } = empty
        //Apply removals
        for (const remove of [...removes, ...this.regexes.cleaners.global, ...(parenthesis ? this.regexes.cleaners.special.empty.parenthesis : [])])
            value = value.replace(remove, " ")
        return value.trim()
    }

}
