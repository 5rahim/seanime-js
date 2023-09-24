import { describe, expect, it, vi } from "vitest"

import { getMediaTitlesFromLocalDirectory } from "@/lib/local-library/helpers"
import { experimental_blindScanLocalFiles } from "@/lib/local-library/scan"
import { initialSettings } from "@/atoms/settings"

vi.mock("react", async () => {
    const actual = (await vi.importActual("react")) as any
    return {
        ...actual,
        cache: vi.fn(v => v),
    }
})

const settings = {
    ...initialSettings,
    library: {
        localDirectory: "E:/ANIME",
    },
}

describe.skip("Media titles", () => {

    it("should retrieve all media titles from a local directory", async () => {
        const result = await getMediaTitlesFromLocalDirectory("E:/ANIME")
        console.log(result)
        expect(result).toBeDefined()
    })

})

describe("experimental_blindScanLocalFiles", () => {

    it("should scan the local library", async () => {
        const result = await experimental_blindScanLocalFiles(settings)
        console.log(result)
        expect(result).toBeDefined()
    }, { timeout: 1000000 })

})
