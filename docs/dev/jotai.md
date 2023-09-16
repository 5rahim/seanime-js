# Jotai

## References

- [Large objects](https://jotai.org/docs/recipes/large-objects)
- [Split atoms](https://jotai.org/docs/utilities/split)

### Local files

```ts
export const localFilesAtom = atomWithStorage<LocalFile[]>("sea-local-files", [], undefined, { unstable_getOnInit: true })

// Split [LocalFile]s into multiple atoms with `path` as the unique key
export const localFileAtoms = splitAtom(localFilesAtom, localFile => localFile.path)

// Get [LocalFile] atoms from a specific media
const getLocalFileAtomsByMediaIdAtom = atom(null,
    (get, set, mediaId: number) => {
        // Filter split atoms
        return get(localFileAtoms).filter((fileAtom) => get(fileAtom).mediaId === mediaId)
    },
)

export const useLocalFileAtomsByMediaId = (mediaId: number) => {
    const [, get] = useAtom(getLocalFileAtomsByMediaIdAtom)
    return useMemo(() => get(mediaId), [/** Dependencies **/])
}
```

![img_3.png](../images/img_3.png)
