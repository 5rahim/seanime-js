"use server"
import { AnilistDetailedMedia } from "@/lib/anilist/fragment"
import { isSeasonTitle } from "@/lib/local-library/media-matching"
import { LocalFile } from "@/lib/local-library/local-file"
import rakun from "@/lib/rakun/rakun"
import { logger } from "@/lib/helpers/debug"
import { isPast } from "date-fns"
import { Nyaa } from "@/lib/download/nyaa/api"


export async function unstable_findNyaaTorrents(props: {
    media: AnilistDetailedMedia,
    aniZipData: AniZipData,
    episode: number,
    batch: boolean,
    lastFile: LocalFile | undefined
}) {
    const { media, aniZipData, episode, lastFile, batch } = props

    const parsed = rakun.parse(media.title?.english ?? media.title?.romaji ?? "")

    /* Constants */
    const IS_MOVIE = media.format === "MOVIE"
    const SPLIT_COUR = !!parsed.cour // If a split cour is present in the title
    const ANI_SEASON = aniZipData?.episodes?.["1"]?.seasonNumber || undefined

    // console.log(aniZipData)

    // Get parsed season
    let season = !IS_MOVIE ? Number(lastFile?.parsedFolderInfo?.findLast(obj => !!obj.season)?.season ?? lastFile?.parsedInfo?.season ?? "-1") : undefined
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

    // const _seasons =

    // let cour =

    const prequel = !IS_MOVIE ?
        // S>1 -> Find prequel
        ((!!season && season > 1) || SPLIT_COUR || (!!ANI_SEASON && ANI_SEASON > 1)) ? media.relations?.edges?.find(edge => edge?.relationType === "PREQUEL")?.node
            // OVA or ONA -> Find parent
            : (media.format === "OVA" || media.format === "ONA") ? media.relations?.edges?.find(edge => edge?.relationType === "PARENT")?.node
                : undefined
        : undefined

    const sequel = !IS_MOVIE ?
        media.relations?.edges?.find(edge => edge?.relationType === "SEQUEL")?.node
        : undefined

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

    // Get the absolute episode only if:
    // - There is a prequel, and we are at least at Season 2 or Cour 2
    const absoluteEpisode = (!!prequel && !!prequel.episodes && (SPLIT_COUR || (season && season > 1))) ? (+prequel.episodes + episode) : undefined

    // ---------------------------------------------------
    /* Format title */

    // eg: [jujutsu kaisen, ...]
    let prospectiveTitleArr = [media.title?.english, media.title?.userPreferred, media.title?.romaji, ...(media.synonyms?.filter(isSeasonTitle) || [])]
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

    if (!IS_MOVIE) {
        let _seasons_string = `(season ${season}|season ${zeropad(season)}|s${zeropad(season)}|s${season})`
        if (batch) {
            const digits = Math.max(2, Math.log(media.episodes ?? 0) * Math.LOG10E + 1 | 0)
            let _rest = `(${zeropad(1, digits)}-${zeropad(media.episodes ?? 0, digits)}|${zeropad(1, digits)} ~ ${zeropad(media.episodes ?? 0, digits)}|Batch|Complete)`
            if (season) _search_string += _seasons_string
            _search_string += _rest
        } else {
            // eg: ((jujustu kaisen)|(jjk))(01|e01|...)
            if (season) _search_string += _seasons_string
            let _episodes_string = `(${zeropad(episode)}|e${zeropad(episode)}|e${zeropad(episode)}v|${zeropad(episode)}v|ep${episode})`
            _search_string += _episodes_string


            if (absoluteEpisode && parsed.name) {
                // _search_string = "(" + _search_string + ")" // Enclose the previous titles with episodes
                // eg: ...|(jujutsu kaisen 27)
                _search_string += "|(" + (`${parsed.name} ${absoluteEpisode}`.toLowerCase()) + ")"
            }
        }
    }

    console.log({
        titles: _search_string,
        season,
        cour: parsed.cour,
        prequel: prequel?.title?.english,
        absoluteEpisode,
    })

    const searchResult = await Nyaa.search({
        title: _search_string,
        category: "1_2",
    })

    return searchResult.torrents

}

function zeropad(v: string | number = 1, l = 2) {
    return (typeof v === "string" ? v : v.toString()).padStart(l, "0")
}
