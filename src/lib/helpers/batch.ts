import { LocalFileWithMedia } from "@/lib/local-library/local-file"

export async function runWithConcurrencyLimit(tasks: (() => Promise<any>)[], concurrencyLimit: number): Promise<void> {
    const results: LocalFileWithMedia[] = []
    let i = 0

    async function processNextTask() {
        if (i < tasks.length) {
            const taskIndex = i++
            const task = tasks[taskIndex]
            const result = await task()
            results[taskIndex] = result
            await processNextTask()
        }
    }

    const concurrencyPromises = Array.from({ length: concurrencyLimit }, processNextTask)
    await Promise.all(concurrencyPromises)
}

// await PromiseBatch(resolveTitle, [...new Set(parseObjs.map(obj => getParseObjTitle(obj)))].filter(title => !(title in relations)), 10)

export async function PromiseBatch(task: any, items: any, allUserMedia: any, relatedMedia: any, batchSize: number) {
    let position = 0
    let results: any = []
    while (position < items.length) {
        const itemsForBatch = items.slice(position, position + batchSize)
        results = [...results, ...await Promise.all(itemsForBatch.map((item: any) => task(item, allUserMedia, relatedMedia)))]
        position += batchSize
    }
    return results
}
