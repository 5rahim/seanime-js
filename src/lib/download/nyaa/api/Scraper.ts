import { URL } from "url"

import { load } from "cheerio"
import { Element, Entry, SearchResult, SearchTorrent } from "./types"
import bytes from "bytes-iec"

export const parseSearch = (
    html: string,
    host = "https://nyaa.si",
): SearchResult => {
    const content = load(html)

    const parseSearch = (i: number, el: Element): SearchTorrent => {
        const tagList = el.childNodes.filter((n) => n.type === "tag")

        const file_size = tagList.find((tag, i) => tag.name === "td" && i === 3)?.children.find((tag) => tag.type === "text")?.data.trim() || ""

        return {
            id: parseInt(
                tagList.find((tag, i) => tag.name === "td" && i === 1)?.children.find((tag) => tag.name === "a")?.attribs?.href?.split("/")?.pop() || "",
            ),
            category: {
                label: tagList.find((tag) => tag.name === "td")?.children.find((tag) => tag.name === "a")?.attribs?.title || "",
                code: new URL(
                    host +
                    tagList.find((tag) => tag.name === "td")?.children.find((tag) => tag.name === "a")?.attribs.href || "",
                ).searchParams.get("c") || "",
            },
            name: tagList.find((tag, i) => tag.name === "td" && i === 1)?.children?.find(
                (tag) =>
                    tag.name === "a" &&
                    (!tag.attribs.class || !tag.attribs.class.includes("comments")),
            )?.attribs?.title?.trim() || "",
            links: {
                page: tagList.find((tag, i) => tag.name === "td" && i === 1)?.children.find((tag) => tag.name === "a")?.attribs.href || "",
                file: tagList.find((tag, i) => tag.name === "td" && i === 2)?.children.find((tag) => tag.name === "a")?.attribs.href || "",
                magnet: tagList.find((tag, i) => tag.name === "td" && i === 2)?.children?.find((tag) => tag.name === "a" &&
                    tag.attribs.href &&
                    tag.attribs.href.startsWith("magnet"),
                )?.attribs?.href || "",
            },
            file_size,
            file_size_bytes: bytes.parse(file_size) ?? 0,
            stats: {
                downloaded: parseInt(
                    tagList?.find((tag, i) => tag.name === "td" && i === 7)?.children.find((tag) => tag.type === "text")?.data?.trim() || "",
                ),
                seeders: parseInt(
                    tagList?.find((tag, i) => tag.name === "td" && i === 5)?.children?.find((tag) => tag?.type === "text")?.data?.trim() || "",
                ),
                leechers: parseInt(
                    tagList?.find((tag, i) => tag.name === "td" && i === 6)?.children?.find((tag) => tag.type === "text")?.data?.trim() || "",
                ),
            },
            timestamp: parseInt(
                tagList.find((tag, i) => tag.name === "td" && i === 4)?.attribs["data-timestamp"] || "",
            ),
            entry: getEntry(el.attribs.class),
        }
    }

    const current_page =
        Number.parseInt(
            content("body > div.container > div.center > nav > ul").html()
                ? new URL(
                content("body > div.container > div.center > nav > ul > li.active > a").attr("href") as string,
                host,
            ).searchParams.get("p") || ""
                : content("body > div.container > div.center > ul > li.active").text() || "",
        ) || 1

    const last_page =
        Number.parseInt(
            content("body > div.container > div.center > nav > ul").html()
                ? new URL(
                content("body > div.container > div.center > nav > ul > li:last-of-type")?.prev()?.children("a")?.attr("href") as string,
                host,
            ).searchParams.get("p") || ""
                : new URL(
                content("body > div.container > div.center > ul > li.next")?.prev()?.children("a")?.attr("href") as string,
                host,
            ).searchParams.get("p") || "",
        ) || 1

    const result: SearchResult = {
        current_page,
        last_page,
        torrents: (content("body > div.container > div.table-responsive > table > tbody")?.children("tr") as any)?.map(parseSearch)?.get(),
    }

    return result
}


export const parseTorrent = (id: number, html: string): {
    submitter: { name: string | null; link: string | undefined } | { name: string; link: null };
    description: string;
    file_size: string;
    entry: "[Remake]" | "[Trusted]" | null;
    stats: { seeders: number; leechers: number; downloaded: number };
    name: string;
    links: { torrent: string; magnet: string };
    id: number;
    category: { code: string; label: any }[];
    info_hash: string;
    file_size_bytes: number | null;
    timestamp: number;
    info: string
} => {
    const content = load(html)

    content(".servers-cost-money1").remove()

    const entryMatch = content("body > div.container > div:first-of-type").attr(
        "class",
    )

    return {
        id: id,
        name: content(
            "body > div.container > div.panel:first-of-type > div.panel-heading > h3",
        )
            .text()
            .trim(),
        file_size: content(
            "body > div.container > div.panel > div.panel-body > div:nth-child(4) > div:nth-child(2)",
        ).html() || "",
        file_size_bytes: bytes.parse(
            content(
                "body > div.container > div.panel > div.panel-body > div:nth-child(4) > div:nth-child(2)",
            ).html() as any,
        ),
        category: content(
            "body > div.container > div.panel > div.panel-body > div:nth-child(1) > div:nth-child(2)",
        )
            .children("a")
            .map((i, el) => ({
                label: (el.children[0] as any).data as any,
                code: el.attribs.href.match(/c=(\S+)/i)?.[1] || "",
            }))
            .get(),
        entry: getEntry((entryMatch?.match(/panel-(\S+)$/i) as any)[1]),
        links: {
            torrent: content(
                "body > div.container > div.panel > div:last-of-type > a:first-of-type",
            ).attr("href") || "",
            magnet: content(
                "body > div.container > div.panel > div:last-of-type > a:last-of-type",
            ).attr("href") || "",
        },
        timestamp:
            Number.parseInt(
                content(
                    "body > div.container > div.panel > div.panel-body > div:nth-child(1) > div:nth-child(4)",
                ).attr("data-timestamp") || "",
            ) * 1000,
        submitter: content(
            "body > div.container > div.panel > div.panel-body > div:nth-child(2) > div:nth-child(2) > a",
        ).html()
            ? {
                name: content(
                    "body > div.container > div.panel > div.panel-body > div:nth-child(2) > div:nth-child(2) > a",
                ).html(),
                link: content(
                    "body > div.container > div.panel > div.panel-body > div:nth-child(2) > div:nth-child(2) > a",
                ).attr("href"),
            }
            : {
                name: "Anonymous",
                link: null,
            },
        description: content("#torrent-description").html() || "",
        info:
            content(
                "body > div.container > div.panel > div.panel-body > div:nth-child(3) > div:nth-child(2) a",
            ).attr("href") || "No information",
        info_hash: content(
            "body > div.container > div.panel > div.panel-body > div:nth-child(5) > div.col-md-5 > kbd",
        ).html() || "",
        stats: {
            seeders: Number.parseInt(
                content(
                    "body > div.container > div.panel > div.panel-body > div:nth-child(2) > div:nth-child(4) > span",
                ).html() || "",
            ),
            leechers: Number.parseInt(
                content(
                    "body > div.container > div.panel > div.panel-body > div:nth-child(3) > div:nth-child(4) > span",
                ).html() || "",
            ),
            downloaded: Number.parseInt(
                content(
                    "body > div.container > div.panel > div.panel-body > div:nth-child(4) > div:nth-child(4)",
                ).html() || "",
            ),
        },
    }
}

export function getEntry(entry: string): Entry {
    switch (entry) {
        case "danger":
            return "[Remake]"
        case "success":
            return "[Trusted]"
        default:
            return null
    }
}
