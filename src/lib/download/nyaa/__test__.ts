"use server"

import { Nyaa } from "./api/Nyaa"

export async function __testNyaa() {
    return await Nyaa.search({
        title: "(baki)(s1|season 1)(batch|complete)",
        category: "1_2",
    })
}
