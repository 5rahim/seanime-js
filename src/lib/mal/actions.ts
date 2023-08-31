"use server"
import { logger } from "@/lib/helpers/debug"
import { MALSearchResultAnime } from "@/lib/mal/types"
import { compareValuesToTitle } from "@/lib/local-library/utils"

export async function searchWithMAL(title: string, slice: number | null | undefined = 4) {
    logger("lib/mal/fetchMatchingSuggestions").info(`Fetching matching suggestions for ${title}`)
    try {
        const url = new URL("https://myanimelist.net/search/prefix.json")
        url.searchParams.set("type", "anime")
        url.searchParams.set("keyword", encodeURI(title))
        url.searchParams.set("v", "1")
        console.log(url)
        const res = await fetch(url, {
            method: "GET",
        })
        const body: any = await res.json()
        const items = (body?.categories?.find((category: any) => category?.type === "anime")?.items ?? []) as MALSearchResultAnime[]

        // logger("lib/mal/fetchMatchingSuggestions").info(items)
        const anime = slice ? items.slice(0, slice) : items

        if (!!anime && anime.length > 0) {
            return anime
        } else {
            return []
        }
    } catch (e) {
        logger("lib/mal/fetchMatchingSuggestions").error(e)
        return []
    }
}

/**
 * Find a match using a title by leveraging MAL's search.
 * This is not made to find seasons.
 */
export async function advancedSearchWithMAL(title: string) {
    const _title = title.replace(/\b(cour)\b/, "part").trim()

    const suggestions = (await searchWithMAL(_title, null))
        .filter(n => n.es_score >= 0.1 && n.payload.status !== "Not yet aired")
        .map(n => n.payload.start_year < 2006 ? ({
            ...n,
            es_score: n.es_score - 0.1,
        }) : n).sort((a, b) => b.es_score - a.es_score)

    const result = compareValuesToTitle(_title, suggestions.map(n => n.name))

    const test = suggestions.find(n => (
        n.name.toLowerCase().startsWith(`${_title.split(/\s/)[0]} ${_title.split(/\s/)[1] || ``}`.toLowerCase().trim())
        && n.payload.media_type === "TV"
        && !_title.toLowerCase().match(/\b(film|movie|season|part|(s\d{2}e?))\b/i)
    ))
    const test2 = suggestions.find(n => (
        n.name.toLowerCase().startsWith(`${_title.split(/\s/)[0]}`.toLowerCase().trim())
        && n.payload.media_type === "TV"
        && !_title.toLowerCase().match(/\b(film|movie|season|part|(s\d{2}e?))\b/i)
    ))

    const suggestionFromDistance = suggestions.find(n => n.name === result.value)

    if (!!suggestionFromDistance && result.distance !== undefined && !!result.value) {

        if (suggestions[0].es_score >= 4.5) {
            //logger("experimental").info("Strong correlation using MAL")
            return suggestions[0]
        }
        if (result.distance <= 1) {
            //logger("experimental").info("Perfect match using distance")
            return suggestionFromDistance
        }
        // Distance is lower than 4 (Very good)
        if (result.distance <= 4) {
            //logger("experimental").info("Very Likely match using distance")
            return suggestionFromDistance
        }

        if (suggestions[0].es_score < 5) { // Distance > 4, es_score < 10
            if ((!!test && Math.abs(test.es_score - suggestions[0].es_score) < 2 && `${_title.split(/\s/)[0]} ${_title.split(/\s/)[1] || ``}`.length > 6) || (!!test2 && Math.abs(test2.es_score - suggestions[0].es_score) < 1.2 && _title.split(/\s/)[0].length > 6)) {
                //logger("experimental").info("Likely match using [startsWith]")
                return test || test2
            } else if (suggestionFromDistance.es_score >= 1 && !(suggestions[0].es_score > 3)) {
                //logger("experimental").info("Likely match using distance")
                return suggestionFromDistance
            } else {
                //logger("experimental").info("Less than likely match using MAL")
                return suggestions[0]
            }
        }
        // Distance is greater than 5 -> Fallback to first suggestion
        if (result.distance >= 5 && suggestions[0].es_score >= 1) {
            //logger("experimental").info("Distance above threshold, falling back to first MAL suggestion above [1]")
            return suggestions[0]
        }
    }
    if (suggestions[0].es_score > 1) {
        return suggestions[0]
    }
    return undefined
}
