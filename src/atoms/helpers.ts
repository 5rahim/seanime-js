import { PrimitiveAtom } from "jotai"
import { useSetAtom } from "jotai/react"
import { focusAtom } from "jotai-optics"
import { useCallback } from "react"
import { OpticFor_ } from "optics-ts"


export const useFocusSetAtom = <T>(anAtom: PrimitiveAtom<T>, prop: keyof T) => {
    return useSetAtom(
        focusAtom(
            anAtom,
            useCallback((optic: OpticFor_<T>) => optic.prop(prop), []),
        ),
    )
}
