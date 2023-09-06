export function deepmerge<T = Record<string, unknown>>(
    target: T,
    ...sources: T[]
): T {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const isObject = (obj: object) => obj && typeof obj === "object"
    sources.forEach((source: any) =>
        Object.keys(source).forEach((key) => {
            // @ts-ignore
            const targetValue = target[key]
            const sourceValue = source[key]

            if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
                // @ts-ignore
                target[key] = targetValue.concat(sourceValue)
            } else if (
                isObject(targetValue) &&
                isObject(sourceValue as Record<string, unknown>)
            ) {
                // @ts-ignore
                target[key] = deepmerge(
                    Object.assign({}, targetValue),
                    sourceValue as Record<string, unknown>,
                )
            } else {
                // @ts-ignore
                target[key] = sourceValue
            }
        }),
    )

    return target
}
