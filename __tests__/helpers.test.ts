import { describe, expect, it } from "vitest"
import {
    path_getDirectoryName,
    path_isAbsolute_SERVER_ONLY,
    path_removeTopDirectory,
    path_removeTopPath,
    path_splitPath,
} from "@/lib/helpers/path"

describe("Path", () => {
    it("should split correctly", () => {
        expect.soft(path_splitPath("E:/Anime/Jujutsu Kaisen")).toEqual(["E:", "Anime", "Jujutsu Kaisen"])
        expect.soft(path_splitPath("Anime/Jujutsu Kaisen")).toEqual(["Anime", "Jujutsu Kaisen"])
        expect.soft(path_splitPath("/dir")).toEqual(["dir"])
    })
    it("should remove top directory", () => {
        expect.soft(path_removeTopDirectory("E:/Anime/Jujutsu Kaisen")).toEqual(`Anime/Jujutsu Kaisen`)
    })
    it("should remove top path", () => {
        expect.soft(path_removeTopPath("E:/Anime/Jujutsu Kaisen", "E:/Anime")).toEqual(`Jujutsu Kaisen`)
        expect.soft(path_removeTopPath("/dir/Jujutsu Kaisen", "/dir")).toEqual(`Jujutsu Kaisen`)
    })
    it("should return the right directory", () => {
        expect.soft(path_removeTopPath(path_getDirectoryName("E:/Anime/Jujutsu Kaisen/Jujutsu Kaisen 05.mkv"), "E:/Anime")).toEqual(`Jujutsu Kaisen`)
        expect.soft(path_removeTopPath(path_getDirectoryName("/dir/Jujutsu Kaisen/Jujutsu Kaisen 05.mkv"), "/dir")).toEqual(`Jujutsu Kaisen`)
        expect.soft(path_removeTopPath(path_getDirectoryName("/dir/Jujutsu Kaisen/Season 1/Jujutsu Kaisen 05.mkv"), "/dir")).toEqual(`Jujutsu Kaisen/Season 1`)
    })
    it("should return directory name", () => {
        expect.soft(path_getDirectoryName("E:/Anime/Jujutsu Kaisen/Jujutsu Kaisen 05 [ABCD].mkv")).toEqual(`E:/Anime/Jujutsu Kaisen`)
        expect.soft(path_getDirectoryName("E:\\Anime\\[Judas] Golden Kamuy (Season 3) [1080p][HEVC x265 10bit][Multi-Subs]\\[Judas] Golden Kamuy - S03E01.mkv")).toEqual(`E:/Anime/[Judas] Golden Kamuy (Season 3) [1080p][HEVC x265 10bit][Multi-Subs]`)
    })
    it("should be absolute", () => {
        // Doesn't work in browsers
        expect.soft(path_isAbsolute_SERVER_ONLY("/dir")).toEqual(true)
        expect.soft(path_isAbsolute_SERVER_ONLY("/dir")).toEqual(true)
        expect.soft(path_isAbsolute_SERVER_ONLY("E:/Anime/Jujutsu Kaisen")).toEqual(true)
        expect.soft(path_isAbsolute_SERVER_ONLY("E:/Anime/Jujutsu Kaisen")).toEqual(true)
    })
})
