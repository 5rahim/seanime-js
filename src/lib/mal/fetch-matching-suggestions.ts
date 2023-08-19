"use server"
import { logger } from "@/lib/helpers/debug"

export async function fetchMALMatchingSuggestions(title: string) {
    let suggestions: any = []
    logger("lib/mal/fetchMatchingSuggestions").info(`Fetching matching suggestions for ${title}`)
    try {
        const url = new URL("https://myanimelist.net/search/prefix.json")
        url.searchParams.set("type", "anime")
        url.searchParams.set("keyword", title)
        const res = await fetch(url, {
            method: "GET",
        })
        const body: any = await res.json()
        const anime = body?.categories?.find((category: any) => category?.type === "anime")?.items?.slice(0, 4)

        if (anime && anime.length > 0) {
            suggestions = [...suggestions, ...anime]
        }
    } catch (e) {
        logger("lib/mal/fetchMatchingSuggestions").error(e)
    }

    return suggestions
}
