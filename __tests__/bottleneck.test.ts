import { describe, expect, it, vi } from "vitest"
import Bottleneck from "bottleneck"

vi.mock("react", async () => {
    const actual = (await vi.importActual("react")) as any
    return {
        ...actual,
        cache: vi.fn(v => v),
    }
})

async function longAPICall() {
    const ms = Math.floor(Math.random() * (450 - 50 + 1) + 100)
    await new Promise(resolve => setTimeout(resolve, ms))
    console.log("longAPICall")
    return "longAPICall"
}

describe("Bottleneck", () => {
    it.skip("should not hit the rate limit", async () => {
        const limiter = new Bottleneck({
            reservoir: 90, // initial value
            reservoirRefreshAmount: 90,
            reservoirRefreshInterval: 60 * 1000, // must be divisible by 250
            maxConcurrent: 1,
            minTime: 1000 / 90, // Minimum time (in milliseconds) between requests - 90 requests per minute
        })

        let res = ""
        for (let i = 0; i < 100; i++) {
            res += await limiter.schedule(longAPICall)
        }

        expect(res.length).toBeGreaterThan(0)
    }, { timeout: 1000000 })

    it.skip("should not hit the rate limit Promise.all", async () => {
        const limiter = new Bottleneck({
            reservoir: 90, // initial value
            reservoirRefreshAmount: 90,
            reservoirRefreshInterval: 60 * 1000, // must be divisible by 250
            maxConcurrent: 50,
            minTime: 1000 / 90, // Minimum time (in milliseconds) between requests - 90 requests per minute
        })

        const promises = await Promise.all(
            Array.from({ length: 100 }, () => limiter.schedule(longAPICall)),
        )

        expect(promises.length).toBe(100)
    }, { timeout: 1000000 })
})
