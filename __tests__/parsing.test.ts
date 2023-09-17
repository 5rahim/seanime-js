import rakun from "@/lib/rakun"
import { expect, test } from "vitest"

test("episodes should be parsed correctly", () => {
    expect.soft(rakun.parse("[Judas] Blue Lock - S01E05.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] Blue Lock - S01_E05.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] Blue Lock - S01_05.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] Blue Lock - S01 - E05.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] Blue Lock - S01 - 05.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] Blue Lock - S01 05.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] Blue Lock - S01E05v2.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] Blue Lock - S01E05 v2.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] Blue Lock - S01E05'.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] Blue Lock - E05.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] Blue Lock - 05.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] Blue Lock - 01x05.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] Blue Lock - 5.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] Blue Lock - 5.2 .mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] Blue Lock 05.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] 05.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] 05 - Episode title.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] Blue Lock - 05 - Episode title.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] One Piece - 1075 - Episode title.mkv")).toHaveProperty("episode", "1075")
    expect.soft(rakun.parse("[Judas] Blue Lock 05 Episode title.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Judas] Zom 100: Zombie ni Naru Made ni Shitai 100 no Koto - 05.mkv")).toHaveProperty("episode", "5")
    expect.soft(rakun.parse("[Erai-raws] Ryza no Atelier - Tokoyami no Joou to Himitsu no Kakurega - 12 [1080p][HEVC][Multiple Subtitle] [ENG][POR-BR].mkv")).toHaveProperty("episode", "12")
    expect.soft(rakun.parse("[Chihiro] Hataraku Maou-sama!! 22 [1080p Hi10P AAC][4ADF2D98].mkv")).toHaveProperty("episode", "22")

    expect.soft(rakun.parse("[Judas] Blue Lock 5.mkv")).not.toHaveProperty("episode", "5")
})


test("seasons should be parsed correctly", () => {
    expect.soft(rakun.parse("[Erai-raws] Edens Zero 2nd Season - 24 [1080p][HEVC][Multiple Subtitle] [ENG][POR-BR][SPA-LA][ARA][RUS].mkv")).toHaveProperty("season", "2")
})
