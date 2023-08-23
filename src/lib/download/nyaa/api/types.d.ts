import { ElementType } from "domelementtype"
import { RequestOptions } from "smol-request"

export * from "domhandler"

export interface Session {
    sessionId?: string
    sessionExpiration?: Date | string
}

export interface LoginPayload {
    username: string
    password: string
    csrf_token?: string
}

export interface NyaaRequestOptions<T = "text"> extends RequestOptions<T> {
    baseUrl?: string
}

export type NyaaApiRequestResult<T> =
    | {
    status: "error"
    message: string
}
    | {
    status: "ok"
    data: T
}

export interface AgentOptions {
    host?: string
    apiHost?: string
}

export interface SearchQuery {
    title: string
    filter?: number
    /**
     * ```json
     * {
     *   "0_0": "All categories",
     *   "1_0": "Anime",
     *   "1_1": "Anime - AMV",
     *   "1_2": "Anime - English",
     *   "1_3": "Anime - Non-English",
     *   "1_4": "Anime - Raw",
     *   "2_0": "Audio",
     *   "2_1": "Audio - Lossless",
     *   "2_2": "Audio - Lossy",
     *   "3_0": "Literature",
     *   "3_1": "Literature - English",
     *   "3_2": "Literature - Non-English",
     *   "3_3": "Literature - Raw",
     *   "4_0": "Live Action",
     *   "4_1": "Live Action - English",
     *   "4_2": "Live Action - Idol/PV",
     *   "4_3": "Live Action - Non-English",
     *   "4_4": "Live Action - Raw",
     *   "5_0": "Pictures",
     *   "5_1": "Pictures - Graphics",
     *   "5_2": "Pictures - Photos",
     *   "6_0": "Software",
     *   "6_1": "Software - Apps",
     *   "6_2": "Software - Games"
     * }
     * ```
     */
    category?: keyof RootCategories
}

export interface SearchParams {
    q: string
    f?: number
    c?: string
}

export interface GetTorrentOptions {
    withComments?: boolean
}

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T

export interface AllCategories {
    "0_0": "All categories"
}

export interface Anime {
    "1_0": "Anime"
    "1_1": "Anime - AMV"
    "1_2": "Anime - English"
    "1_3": "Anime - Non-English"
    "1_4": "Anime - Raw"
}

export interface Audio {
    "2_0": "Audio"
    "2_1": "Audio - Lossless"
    "2_2": "Audio - Lossy"
}

export interface Literature {
    "3_0": "Literature"
    "3_1": "Literature - English"
    "3_2": "Literature - Non-English"
    "3_3": "Literature - Raw"
}

export interface LiveAction {
    "4_0": "Live Action"
    "4_1": "Live Action - English"
    "4_2": "Live Action - Idol/PV"
    "4_3": "Live Action - Non-English"
    "4_4": "Live Action - Raw"
}

export interface Picture {
    "5_0": "Pictures"
    "5_1": "Pictures - Graphics"
    "5_2": "Pictures - Photos"
}

export interface Software {
    "6_0": "Software"
    "6_1": "Software - Apps"
    "6_2": "Software - Games"
}

export type RootCategories = AllCategories &
    Anime &
    Audio &
    Literature &
    LiveAction &
    Picture &
    Software


export interface Attribute {
    name: string
    value: string
    namespace?: string
    prefix?: string
}

export class Node {
    name: string
    attribs: {
        [name: string]: string
    }

    type: ElementType
    /** Parent of the node */
        // eslint-disable-next-line no-use-before-define
    parent?: Node
    /** Previous sibling */
    prev?: Node
    /** Next sibling */
    next?: Node
    /** The start index of the node. Requires `withStartIndices` on the handler to be `true. */
    startIndex?: number
    /** The end index of the node. Requires `withEndIndices` on the handler to be `true. */
    endIndex?: number
    data: string
    children: Node[]

    /**
     * @param type Type of the node.
     * @param children Children of the node. Only certain node types can have children.
     */
    constructor(
        type:
            | ElementType.Root
            | ElementType.CDATA
            | ElementType.Script
            | ElementType.Style
            | ElementType.Tag,
        children: Node[],
    )

    get nodeType(): number

    get parentNode(): Node | null

    set parentNode(parent: Node | null)

    get previousSibling(): Node | null

    set previousSibling(prev: Node | null)

    get nextSibling(): Node | null

    set nextSibling(next: Node | null)

    get firstChild(): Node | null

    get lastChild(): Node | null

    get childNodes(): Node[]

    set childNodes(children: Node[])

    /**
     * Clone this node, and optionally its children.
     *
     * @param recursive Clone child nodes as well.
     * @returns A clone of the node.
     */
    cloneNode(recursive?: boolean): Node
}

export class Element extends Node {
    "x-attribsNamespace"?: Record<string, string>
    "x-attribsPrefix"?: Record<string, string>

    /**
     * @param name Name of the tag, eg. `div`, `span`.
     * @param attribs Object mapping attribute names to attribute values.
     * @param children Children of the node.
     */
    constructor(
        name: string,
        attribs: {
            [name: string]: string
        },
        children?: Node[],
    )

    get tagName(): string

    set tagName(name: string)

    get attributes(): Attribute[]
}

export interface Profile {
    id: number
    username: string
    avatar: string
    class: string
    created_at: Date
}

export type Entry = "[Remake]" | "[Trusted]" | null

export interface Comment {
    /**
     * Comment id
     */
    id: number

    /**
     * Commenter
     */
    from: {
        /**
         * Commenter username
         */
        username: string

        /**
         * Avatar absolute url
         */
        avatar: string
    }

    /**
     * Comment timestamp UTC
     */
    timestamp: number

    /**
     * Publish date
     */
    publish_date: Date

    /**
     * Comment text
     */
    text: string
}

// export interface ApiTorrent {
//   id: number
//   name: string
//   url: string
//   submitter: string
//   description: string
//   information: string
//   is_complete: boolean
//   is_remake: boolean
//   is_trusted: boolean
//   main_category: string
//   main_category_id: number
//   sub_category: string
//   sub_category_id: number
//   hash_b32: string
//   hash_hex: string
//   files: {
//     [x: string]: number
//   }
//   filesize: number
//   magnet: string
//   stats: {
//     downloads: number
//     leechers: number
//     seeders: number
//   }
//   creation_date: string
//   comments?: Comment[]
// }

export interface ViewTorrent {
    id: number
    name: string
    file_size: string
    file_size_bytes: number
    category: {
        label: string
        code: string
    }[]
    entry: Entry
    links: {
        torrent: string
        magnet: string
    }
    timestamp: number
    submitter: {
        name: string
        link?: string
    }
    description: string
    info: string
    info_hash: string
    stats: {
        seeders: number
        leechers: number
        downloaded: number
    }
    comments?: Comment[]
}

export interface SearchTorrent {
    id: number
    category: {
        label: string
        code: string
    }
    name: string
    links: {
        page: string
        file: string
        magnet: string
    }
    file_size: string
    file_size_bytes: number
    timestamp: number
    stats: {
        downloaded: number
        seeders: number
        leechers: number
    }
    entry: Entry
}

export interface SearchResult {
    current_page: number
    last_page: number
    torrents: SearchTorrent[]
}

export interface RSSFile {
    id: number
    title: string
    guid: string
    description: string
    pubDate: Date
    seeders: number
    leechers: number
    downloads: number
    infoHash: string
    categoryId: string
    category: string
    size: string
    comments: number
    trusted: string
    remake: string
}
