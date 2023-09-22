import { __SampleLocalFiles } from "../samples/local-file.sample"

export default {
    "createLocalFile": Object.values(__SampleLocalFiles).map(file => ({
        initialProps: { path: file.path, name: file.name },
        expected: file,
    })),
}
