export type LocalFile = {
    title: string
    path: string
}

/**
 * [LocalFile] represents a file on the host machine.
 * - Use [path] to identity the file
 */

export const createLocalFile = (props: LocalFile) => {
    return {
        title: props.title,
        path: props.path,
    }
}
