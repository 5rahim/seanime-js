"use server"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import rakun from "@/lib/rakun"
import { logger } from "@/lib/helpers/debug"
import { isPast } from "date-fns"
import { Nyaa } from "@/lib/download/nyaa/api"

import { LocalFile } from "@/lib/local-library/types"
import { valueContainsSeason } from "@/lib/local-library/utils/filtering.utils"
import { anilist_findMediaEdge, anilist_findMediaSeasonFromTitles } from "@/lib/anilist/utils"


export async function findNyaaTorrents(props: {
    media: AnilistDetailedMedia,
    aniZipData: AniZipData,
    episode: number,
    batch: boolean,
    latestFile: LocalFile | undefined
    offset: number
}) {
    const { media, aniZipData, episode, latestFile, batch, offset } = props

    const parsed = rakun.parse(media.title?.english ?? media.title?.romaji ?? "")

    const _splitName = parsed.name.split(":").filter(Boolean).map(n => n.trim())
    // const _splitName2 = parsed.name.split("|").filter(Boolean).map(n => n.trim())

    /* Constants */
    const IS_MOVIE = media.format === "MOVIE"
    const SPLIT_COUR = !!parsed.cour // If a split cour is present in the title
    const ANI_SEASON = aniZipData?.episodes?.["1"]?.seasonNumber || undefined

    // console.log(aniZipData)

    // Get parsed season
    const __seasonFromFile = Number(latestFile?.parsedFolderInfo?.findLast(obj => !!obj.season)?.season ?? latestFile?.parsedInfo?.season ?? "-1")
    const __seasonFromTitles = anilist_findMediaSeasonFromTitles(media)

    let season = !IS_MOVIE ? (__seasonFromFile && __seasonFromFile > -1 ? __seasonFromFile : (__seasonFromTitles || __seasonFromFile)) : undefined
    season = season === -1 ? undefined : season
    if (!!ANI_SEASON) {
        if (!!season && season !== ANI_SEASON && !SPLIT_COUR) {
            logger("findNyaaTorrents").warning("Different seasons detected", `Parsed: ${season}`, `AniZip: ${ANI_SEASON}`, `Split cour?: ${SPLIT_COUR}`)
            season = ANI_SEASON // Replace parsed season with AniZip's season if there isn't a split cour
        }
    }
    if (!season) {
        season = !!parsed.season ? Number(parsed.season) : undefined
    }

    const sequel = !IS_MOVIE ? anilist_findMediaEdge({ media, relation: "SEQUEL" })?.node : undefined

    if (!!sequel && sequel.startDate?.year && sequel.startDate?.month && !season) {
        const sequelStartDate = new Date(sequel.startDate?.year || 0, sequel.startDate?.month || 0)
        const isStartDatePast = isPast(sequelStartDate)
        if (!!sequel.startDate && isStartDatePast) {
            if (ANI_SEASON) season = ANI_SEASON
            else {
                season = 1
            }
        }
    }


    // \/ Incorrect
    // Get the absolute episode only if:
    // - There is a prequel, and we are at least at Season 2 or Cour 2
    // const absoluteEpisode = (!!prequel && !!prequel.episodes && (SPLIT_COUR || (season && season > 1))) ? (+prequel.episodes + episode) : undefined
    const absoluteEpisode = +offset + episode

    // ---------------------------------------------------
    /* Format title */

    let englishSplit = media.title?.english?.split(":").filter(Boolean).map(n => n.trim()) || []
    englishSplit = englishSplit[1]?.length > 10 ? englishSplit : [englishSplit[0]]
    let romajiSplit = media.title?.romaji?.split(":").filter(Boolean).map(n => n.trim()) || []
    romajiSplit = romajiSplit[1]?.length > 10 ? romajiSplit : [romajiSplit[0]]

    // eg: [jujutsu kaisen, ...]
    let prospectiveTitleArr = [
        media.title?.english,
        ...englishSplit,
        media.title?.romaji,
        ...romajiSplit,
        ...(media.synonyms?.filter(valueContainsSeason) || []),
    ]
    prospectiveTitleArr = [
        ...(new Set(
                prospectiveTitleArr
                    .filter(Boolean)
                    .map(title => title.toLowerCase().replace(/&/g, "%26").replace(/\?/g, "%3F").replace(/#/g, "%23")),
            )
        ),
    ]

    // eg: "((jujutsu kaisen)|(jjk))"
    let _search_string = `((${prospectiveTitleArr.join(")|(")}))`
    let _search_string_without_seasons = `((${prospectiveTitleArr.join(")|(")}))`

    if (!IS_MOVIE) {
        let _seasons_string = `(season ${season}|season ${zeropad(season)}|s${zeropad(season)}|s${season})`

        // >>> Batch search terms
        if (batch) {
            const digits = Math.max(2, Math.log(media.episodes ?? 0) * Math.LOG10E + 1 | 0)

            let _rest = `(${zeropad(1, digits)} - ${zeropad(media.episodes ?? 0, digits)}|${zeropad(1, digits)}-${zeropad(media.episodes ?? 0, digits)}|${zeropad(1, digits)} ~ ${zeropad(media.episodes ?? 0, digits)}`
            _rest += `|Batch|Seasons|Complete|+ OVA|+ Movie|+ Specials)`

            if (season) _search_string += `(${_seasons_string}|(Seasons|+ Special|+ Specials|+ OVA|Complete|Season))` // Increment

            _search_string += _rest // Increment
            _search_string_without_seasons += _rest // Increment

            _search_string += `|((${prospectiveTitleArr.join(")|(")}))`

        } else {
            // >>> Episode search terms
            // eg: ((jujustu kaisen)|(jjk))(01|e01|...)
            if (season) _search_string += _seasons_string
            let _episodes_string = `(${zeropad(episode)}|e${zeropad(episode)}|e${zeropad(episode)}v|${zeropad(episode)}v|ep${episode})`
            _search_string += _episodes_string
            _search_string_without_seasons += _episodes_string

            if (absoluteEpisode && parsed.name) {
                // _search_string = "(" + _search_string + ")" // Enclose the previous titles with episodes
                // eg: ...|(jujutsu kaisen 27)
                _search_string += "|(" + (`${parsed.name} ${zeropad(absoluteEpisode)}`.toLowerCase()) + ")"
                if (_splitName[0]) _search_string += "|(" + (`${_splitName[0]} ${zeropad(absoluteEpisode)}`.toLowerCase()) + ")"
                if (_splitName[1]) _search_string += "|(" + (`${_splitName[1]} ${zeropad(absoluteEpisode)}`.toLowerCase()) + ")"
            }
        }
    }

    // console.log({
    //     titles: _search_string,
    //     season,
    //     cour: parsed.cour,
    //     prequel: prequel?.title?.english,
    //     absoluteEpisode,
    // })

    try {
        const searchResult = await Nyaa.search({
            title: _search_string,
            category: "1_2",
        })

        if (searchResult.torrents && searchResult.torrents.length > 0) {
            logger("lib/nyaa/search").info("Found torrents for", _search_string)
            return searchResult.torrents
        } else {
            const searchResult2 = await Nyaa.search({
                title: _search_string_without_seasons,
                category: "1_2",
            })
            logger("lib/nyaa/search").info("Couldn't find torrents with season, found torrents for", _search_string_without_seasons)
            return searchResult2.torrents
        }
    } catch (e) {
        logger("lib/nyaa/search").error("Could not fetch torrents for", _search_string)
        logger("lib/nyaa/search").error(e)
        return []
    }

}

function zeropad(v: string | number = 1, l = 2) {
    return (typeof v === "string" ? v : v.toString()).padStart(l, "0")
}


export async function searchNyaaTorrents(search: string) {
    const searchResult = await Nyaa.search({
        title: search,
        category: "1_2",
    })

    return searchResult.torrents
}
