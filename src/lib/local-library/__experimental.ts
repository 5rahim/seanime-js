"use server"


export async function PromiseBatch<T, R>(
    task: (item: T) => Promise<R>,
    items: T[],
    batchSize: number,
): Promise<R[]> {
    let position = 0
    let results: R[] = []

    while (position < items.length) {
        const itemsForBatch = items.slice(position, position + batchSize)
        results = [...results, ...(await Promise.all(itemsForBatch.map((item) => task(item))))]
        position += batchSize
    }

    return results
}

export async function PromiseBatchWithDelay<T, R>(
    task: (item: T) => Promise<R>,
    items: T[],
    batchSize: number,
    delayMs: number,
): Promise<R[]> {
    let position = 0
    let results: R[] = []

    async function processBatch() {
        const itemsForBatch = items.slice(position, position + batchSize)
        const batchPromises = itemsForBatch.map((item) => task(item))
        const batchResults = await Promise.all(batchPromises)
        results = [...results, ...batchResults]
        position += batchSize

        if (position < items.length) {
            // Delay before processing the next batch
            await new Promise((resolve) => setTimeout(resolve, delayMs))
            await processBatch()
        }
    }

    await processBatch()

    return results
}

export async function PromiseAllSettledBatch<T, R>(
    task: (item: T) => Promise<R>,
    items: T[],
    batchSize: number,
): Promise<PromiseSettledResult<R>[]> {
    let position = 0
    let results: PromiseSettledResult<R>[] = []

    while (position < items.length) {
        const itemsForBatch = items.slice(position, position + batchSize)
        const batchPromises = itemsForBatch.map((item) => task(item))
        const batchResults = await Promise.allSettled(batchPromises)
        results = [...results, ...batchResults]
        position += batchSize
    }

    return results
}

export async function PromiseBatchAllSettledWithDelay<T, R>(
    task: (item: T) => Promise<R>,
    items: T[],
    batchSize: number,
    delayMs: number,
): Promise<PromiseSettledResult<R>[]> {
    let position = 0
    const results: PromiseSettledResult<R>[] = []

    async function processBatch() {
        const itemsForBatch = items.slice(position, position + batchSize)
        const batchPromises = itemsForBatch.map((item) => task(item))
        const batchResults = await Promise.allSettled(batchPromises)
        results.push(...batchResults)
        position += batchSize

        if (position < items.length) {
            // Delay before processing the next batch
            await new Promise((resolve) => setTimeout(resolve, delayMs))
            await processBatch()
        }
    }

    await processBatch()

    return results
}

export async function getFulfilledValues<T>(settledResults: PromiseSettledResult<T>[]): Promise<T[]> {
    return settledResults
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) => (result as PromiseFulfilledResult<T>).value)
}
