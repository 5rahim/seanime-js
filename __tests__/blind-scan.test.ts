import { describe, expect, it, vi } from "vitest"

import { experimental_blindScanLocalFiles } from "@/lib/local-library/scan"
import { initialSettings } from "@/atoms/settings"
import { getMediaTitlesFromLocalDirectory } from "@/lib/local-library/repository"

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
        const result = await getMediaTitlesFromLocalDirectory({ directoryPath: "E:/ANIME" })
        console.log(result)
        expect(result).toBeDefined()
    })

})

describe.skip("experimental_blindScanLocalFiles", () => {

    it("should scan the local library", async () => {
        const result = await experimental_blindScanLocalFiles({ settings })
        console.log(result)
        expect(result).toBeDefined()
    }, { timeout: 1000000 })

})
