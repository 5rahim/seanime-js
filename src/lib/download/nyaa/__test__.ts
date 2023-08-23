"use server"

import { Nyaa } from "./api/Nyaa"

export async function __testNyaa() {
    return await Nyaa.search({
        title: "One piece 1069",
        category: "1_2",
    })
}
