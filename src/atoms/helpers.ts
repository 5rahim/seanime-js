import { Atom, PrimitiveAtom } from "jotai"
import { useAtomValue, useSetAtom } from "jotai/react"
import { focusAtom } from "jotai-optics"
import { useCallback } from "react"
import { OpticFor_ } from "optics-ts"
import { selectAtom } from "jotai/utils"
import deepEquals from "fast-deep-equal"


export function useSelectAtom<T, R>(anAtom: PrimitiveAtom<T> | Atom<T>, keyFn: (v: T) => R) {
    return useAtomValue(
        selectAtom(
            anAtom,
            useCallback(keyFn, []),
            deepEquals,
        ),
    )
}

export const useFocusSetAtom = <T>(anAtom: PrimitiveAtom<T>, prop: keyof T) => {
    return useSetAtom(
        focusAtom(
            anAtom,
            useCallback((optic: OpticFor_<T>) => optic.prop(prop), []),
        ),
    )
}
