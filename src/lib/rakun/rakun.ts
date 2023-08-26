//Imports
import * as Regexs from "./regexs/_"

/**
 * Rakun
 * Anime Torrent Name Parser.
 */
export default abstract class Parser {

    /**
     * Regexs.
     */
    private static readonly regexs = Regexs
    /**
     * Processors.
     */
    private static readonly process = Object.freeze({

        /**
         * Main processors
         */
        main(data: parser_data, ...args: {
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
                    const matches = Parser.test({ collection, value: cleaned, get })
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
                        //Put matching regex in queue for removal
                        removes.push(...matches.regexs)
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
            clean(data: parser_data) {
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
            codecs(data: parser_data) {
                //Initialization
                const { result, regexs } = data
                let { codecs } = result
                //Check if codecs exists
                if (codecs) {
                    //If codecs includes both DTS and DTS HDMA, only keep latter version
                    for (const [duplicates, kept] of regexs.processors.post.codecs.duplicates) {
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
            name(data: parser_data) {
                //Initialization
                const { result, rejects, regexs } = data
                //Reverse string (used to make regex starts from end instead of start)
                let value = [...`${result.name} ${rejects.join(" ")}`].reverse().map(c => ({
                    "[": "]",
                    "]": "[",
                } as loose)[c] || c).join("").trim()
                //Remove unparsable attributes
                while (regexs.cleaners.special.unparsable.test(value)) {
                    //Edge case : title is in brackets
                    if (regexs.cleaners.special.only_brackets.test(value)) {
                        //console.debug(`name > post-process > last attribute, assuming it is name`)
                        value = value.match(regexs.cleaners.special.only_brackets)?.groups?.name as string
                        break
                    }
                    //Edge case : no subber has been detected yet but attribute is candidate for it
                    else if ((!result.subber) && (regexs.processors.post.subber.possible_subber_name.test(value))) {
                        result.subber = [...value.match(regexs.processors.post.subber.possible_subber_name)?.groups?.subber as string].reverse().join("")
                        //console.debug(`name > post-process > found unparsable value which may be subber (${result.subber})`)
                    }
                    //Remove unparsable brackets
                    else
                        //console.debug(`name > post-process > found unparsable value ${value.match(regexs.cleaners.special.unparsable)?.groups?.unparsable}`)
                        value = Parser.clean({
                            value,
                            removes: [regexs.cleaners.special.unparsable],
                            empty: { parenthesis: false },
                        })
                }
                //Re-reverse string
                value = [...value].reverse().join("")

                //Post-processor name refiners
                {
                    //If audio is not defined or doesn't include multi but post processor test is positive
                    if (((!result.audio) || (!result.audio.includes("multi"))) && (regexs.processors.post.audio.possible_multi_audio.test(value))) {
                        result.audio = [...new Set([...(result.audio || "").split(" "), "multi"].sort())].join(" ")
                        //console.debug(`audio > post-process > current value = ${result.audio}`)
                        value = Parser.clean({ value, removes: [regexs.processors.post.audio.possible_multi_audio] })
                    }
                    //If episode is not defined, we may be able to find it
                    if ((!result.episode) && (regexs.processors.post.serie.possible_episode.test(value))) {
                        result.episode = value.match(regexs.processors.post.serie.possible_episode)?.groups?.episode
                        //console.debug(`episode > post-process > current value = ${result.episode}`)
                        value = Parser.clean({ value, removes: [regexs.processors.post.serie.possible_episode] })
                    }
                    if (!result.episode) { // If episode is not defined but title contains "1_5" -> Episode 1
                        const matches = value.match(/\b[(\[)]?(?<a>0?\d+)_(?<b>0?\d+)[)\]]?\b/)
                        const a = matches?.groups?.a
                        if (a) {
                            if ((Number(a)) || ((regexs.processors.post.serie.leading_zero.test(a)))) {
                                result["episode"] = Number(a).toString()
                                value = Parser.clean({
                                    value,
                                    removes: [/\b[(\[)]?(?<a>0?\d+)_(?<b>0?\d+)[)\]]?\b/],
                                })
                            }
                        }
                    }
                    if (!result.episode) { // If episode is not defined but title contains "S1_5" or "S1_E5" -> Season 1, Episode 5
                        const matches = value.match(/[-._ ][Ss](?<a>\d+)_E?(?<b>\d+)/)
                        const a = matches?.groups?.a
                        const b = matches?.groups?.b
                        if (a && b) {
                            if ((Number(a)) || ((regexs.processors.post.serie.leading_zero.test(a)))) {
                                if ((Number(b)) || ((regexs.processors.post.serie.leading_zero.test(b)))) {
                                    if (!result.season) {
                                        result["season"] = Number(a).toString()
                                    }
                                    result["episode"] = Number(b).toString()
                                    value = Parser.clean({
                                        value,
                                        removes: [/[-._ ][Ss](?<a>\d+)_E?(?<b>\d+)/],
                                    })
                                }
                            }
                        }
                    }
                    if (!result.episode) { // If episode is not defined but title contains "01x02" or "1x2" -> Season 1, Episode 2
                        const matches = value.match(/\b[(\[)]?S?(?<a>0?\d+)xE?(?<b>0?\d+)[)\]]?\b/)
                        const a = matches?.groups?.a
                        const b = matches?.groups?.b
                        if (a && b) {
                            if ((Number(a)) || ((regexs.processors.post.serie.leading_zero.test(a)))) {
                                if ((Number(b)) || ((regexs.processors.post.serie.leading_zero.test(b)))) {
                                    if (!result.season) {
                                        result["season"] = Number(a).toString()
                                    }
                                    result["episode"] = Number(b).toString()
                                    value = Parser.clean({
                                        value,
                                        removes: [/\b[(\[)]?S?(?<a>0?\d+)xE?(?<b>0?\d+)[)\]]?\b/],
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
                value = value.replace(/\s?-\s?-\s?(.*)(?: |$)/g, "")
                // Remove leftover movie mention
                // eg: Cowboy Bebop +Movie
                value = value.replace(/[+_-][Mm]ovies?/g, "")

                //Replace special characters with spaces if needed
                for (const regex of [...regexs.processors.post.name.special_to_space, ...regexs.processors.post.name.isolated])
                    value = value.replace(regex, " ")

                // console.debug(`name > post-process > current value = ${value}`)
                result.name = value
            },

            /**
             * Post-processing for resolution.
             */
            resolution(data: parser_data) {
                //Initialization
                const { result, regexs } = data
                let { name, resolution } = result
                //Check if resolution does not exist
                if (!resolution) {
                    //If resolution has not been found, maybe one of the number is actually a resolution value
                    const matches = Parser.test({
                        collection: regexs.processors.post.resolution.possible_resolution,
                        value: name,
                    })
                    if (matches.length) {
                        //Extract match
                        const match = matches.matches[0].join(" ")
                        const regex = matches.regexs[0]
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
            serie(data: parser_data) {
                //Initialization
                const { result, rejects, regexs } = data
                //Iterate on move, season, episode and part properties
                for (const key of ["movie", "season", "episode", "part"]) {
                    //Remove leading zeros
                    let value = result[key]
                    if (value) {
                        //Detect ranges
                        // if (regexs.processors.post.serie.range.test(value)) {
                        // const [a, b] = value.trim().split(" ")
                        // //If range is not ascending or upper limit has leading zero while lower hasn't, lower limit is probably not part of a range
                        // if ((Number(a) > Number(b)) || ((regexs.processors.post.serie.leading_zero.test(b)) && (!regexs.processors.post.serie.leading_zero.test(a)))) {
                        //     //console.debug(`${key} > post-process > invalid range or formatting mismatch, accepting ${b} but rejecting ${a}`)
                        //     value = Number(b).toString()
                        //     rejects.push(a)
                        // } else
                        //     value = [a, b].map(Number).join("-")
                        // }
                        //Detect single
                        // else
                        if (regexs.processors.post.serie.single.test(value)) {// eg: 5
                            value = Number(value).toString()
                        } else if (regexs.processors.post.serie.versioned.test(value)) { // eg: 5 2
                            const [a, b] = value.trim().split(/\s+/)
                            if (a && b) { // eg: 01 03
                                if ((Number(a)) || ((regexs.processors.post.serie.leading_zero.test(a)))) {
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
            asian_content(data: parser_data) {
                //Initialization
                const { regexs } = data
                let { cleaned } = data
                //Iterate on asian content regexs
                for (const regex of regexs.processors.pre.name.asian_content)
                    cleaned = cleaned.replace(regex, "$<content>")
                //console.debug(`(meta) > pre-process > cleaned value = ${cleaned}`)
                data.cleaned = cleaned
            },

        }),
    })

    /**
     * Parse filename.
     */
    public static parse(filename: string, options: parser_options = {}) {
        //Preparation
        const regexs = Parser.regexs
        const data = {
            result: { filename: filename.trim() },
            cleaned: filename.trim(),
            removes: [],
            rejects: [],
            regexs,
            options,
        } as parser_data
        //Pre-processing
        this.process.pre.asian_content(data)
        //Main processing
        this.process.main(data,
            { key: "hash", collection: regexs.file.hash, get: "value" },
            { key: "website", collection: regexs.meta.website, get: "value" },
            { key: "extension", collection: regexs.file.extension },
            { key: "resolution", collection: regexs.quality.resolution },
            { key: "codecs", collection: regexs.quality.codecs },
            { key: "source", collection: regexs.quality.source },
            { key: "distributor", collection: regexs.quality.distributor },
            { key: "meta", collection: regexs.meta.data },
            { key: "audio", collection: regexs.lang.audio.extract },
            { key: "audio", collection: regexs.lang.audio.keep, clean: false },
            { key: "subtitles", collection: regexs.lang.subtitles.extract },
            { key: "subtitles", collection: regexs.lang.subtitles.keep, clean: false },
            { key: "subber", collection: regexs.meta.subber, get: "value", mode: "skip" },

            { key: "movie", collection: regexs.serie.movie.range.extract, get: "value" },
            { key: "movie", collection: regexs.serie.movie.single.extract, get: "value" },
            { key: "movie", collection: regexs.serie.movie.range.keep, get: "value", mode: "skip" },
            { key: "movie", collection: regexs.serie.movie.single.keep, get: "value", mode: "skip" },

            // key was "part"
            // { key: "season", collection: regexs.serie.part.range.extract, get: "value" },
            { key: "part", collection: regexs.serie.part.single.extract, get: "value" },
            // { key: "season", collection: regexs.serie.part.range.keep, get: "value", mode: "skip" },
            { key: "part", collection: regexs.serie.part.single.keep, get: "value", mode: "skip" },

            // NEW cour
            { key: "cour", collection: regexs.serie.cour.single.extract, get: "value" },

            // { key: "none", collection: regexs.serie.season.range.extract, get: "value", clean: true, mode: "skip" },
            { key: "seasonRange", collection: regexs.serie.season.range.extract, get: "value" },
            { key: "season", collection: regexs.serie.season.single.extract, get: "value" },
            {
                key: "seasonRange",
                collection: regexs.serie.season.range.keep,
                get: "value",
                clean: false,
                mode: "skip",
            },
            { key: "season", collection: regexs.serie.season.single.keep, get: "value", clean: false, mode: "skip" },

            { key: "episodeRange", collection: regexs.serie.episode.range.extract, get: "value" },
            { key: "episode", collection: regexs.serie.episode.single.extract, get: "value" },
            {
                key: "episodeRange",
                collection: regexs.serie.episode.range.keep,
                get: "value",
                clean: false,
                mode: "skip",
            },
            { key: "episode", collection: regexs.serie.episode.single.keep, get: "value", clean: false, mode: "skip" },
            { key: "meta", collection: regexs.meta.data },
            { cleaners: regexs.cleaners.misc },
        )
        //Post-processing
        this.process.post.serie(data)
        this.process.post.codecs(data)
        this.process.post.resolution(data)
        this.process.post.name(data)
        this.process.post.clean(data)
        return data.result as TorrentInfos
    }

    /**
     * Test a collection of regex on a value and return all matching regex with its captured groups.
     */
    private static test({ value, collection, get = "key" }: {
        value: string,
        collection: RegExp[],
        get?: "key" | "value"
    }): { length: number, matches: any[][], regexs: RegExp[] } {
        //Evaluate regex from collection and filter matching ones
        const matches = collection
            .map(regex => regex.test(value) ? { match: value.match(regex)?.groups, regex } : null)
            .filter((match): match is  { match: loose, regex: RegExp } => !!match)
        //Groups matches and regexs
        return {
            length: matches.length,
            regexs: matches.map(({ regex }) => regex),
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
        for (const remove of [...removes, ...this.regexs.cleaners.global, ...(parenthesis ? this.regexs.cleaners.special.empty.parenthesis : [])])
            value = value.replace(remove, " ")
        return value.trim()
    }

}
