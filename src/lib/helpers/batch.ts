import { logger } from "@/lib/helpers/debug"

export async function PromiseBatch(task: any, items: any, allUserMedia: any, relatedMedia: any, batchSize: number) {
    let position = 0
    let results: any = []
    while (position < items.length) {
        const itemsForBatch = items.slice(position, position + batchSize)
        logger("PromiseBatch").warning("Awaiting items for batch of " + batchSize)
        results = [...results, ...await Promise.all(itemsForBatch.map((item: any) => task(item, allUserMedia, relatedMedia)))]
        logger("PromiseBatch").warning("Resolved, rest " + (+items.length - (+position)))
        position += batchSize
    }
    return results
}
