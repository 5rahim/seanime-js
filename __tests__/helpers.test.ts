import { describe, expect, it } from "vitest"
import {
    getDirectoryPath,
    isPathAbsolute_SERVER,
    removeTopDirectory,
    removeTopPath,
    splitFolderPath,
} from "@/lib/helpers/path"

describe("Path", () => {
    it("should split correctly", () => {
        expect.soft(splitFolderPath("E:/Anime/Jujutsu Kaisen")).toEqual(["E:", "Anime", "Jujutsu Kaisen"])
        expect.soft(splitFolderPath("Anime/Jujutsu Kaisen")).toEqual(["Anime", "Jujutsu Kaisen"])
        expect.soft(splitFolderPath("/dir")).toEqual(["dir"])
    })
    it("should remove top directory", () => {
        expect.soft(removeTopDirectory("E:/Anime/Jujutsu Kaisen")).toEqual(`Anime/Jujutsu Kaisen`)
    })
    it("should remove top path", () => {
        expect.soft(removeTopPath("E:/Anime/Jujutsu Kaisen", "E:/Anime")).toEqual(`Jujutsu Kaisen`)
        expect.soft(removeTopPath("/dir/Jujutsu Kaisen", "/dir")).toEqual(`Jujutsu Kaisen`)
    })
    it("should return the right directory", () => {
        expect.soft(removeTopPath(getDirectoryPath("E:/Anime/Jujutsu Kaisen/Jujutsu Kaisen 05.mkv"), "E:/Anime")).toEqual(`Jujutsu Kaisen`)
        expect.soft(removeTopPath(getDirectoryPath("/dir/Jujutsu Kaisen/Jujutsu Kaisen 05.mkv"), "/dir")).toEqual(`Jujutsu Kaisen`)
        expect.soft(removeTopPath(getDirectoryPath("/dir/Jujutsu Kaisen/Season 1/Jujutsu Kaisen 05.mkv"), "/dir")).toEqual(`Jujutsu Kaisen/Season 1`)
    })
    it("should return directory name", () => {
        expect.soft(getDirectoryPath("E:/Anime/Jujutsu Kaisen/Jujutsu Kaisen 05 [ABCD].mkv")).toEqual(`E:/Anime/Jujutsu Kaisen`)
        expect.soft(getDirectoryPath("E:\\Anime\\[Judas] Golden Kamuy (Season 3) [1080p][HEVC x265 10bit][Multi-Subs]\\[Judas] Golden Kamuy - S03E01.mkv")).toEqual(`E:/Anime/[Judas] Golden Kamuy (Season 3) [1080p][HEVC x265 10bit][Multi-Subs]`)
    })
    it("should be absolute", () => {
        // Doesn't work in browsers
        expect.soft(isPathAbsolute_SERVER("/dir")).toEqual(true)
        expect.soft(isPathAbsolute_SERVER("/dir")).toEqual(true)
        expect.soft(isPathAbsolute_SERVER("E:/Anime/Jujutsu Kaisen")).toEqual(true)
        expect.soft(isPathAbsolute_SERVER("E:/Anime/Jujutsu Kaisen")).toEqual(true)
    })
})
