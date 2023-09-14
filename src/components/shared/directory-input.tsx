"use client"
import React, { startTransition, useCallback, useRef, useState } from "react"
import { TextInput } from "@/components/ui/text-input"
import { useDebounce } from "@/hooks/use-debounce"
import { useAsync } from "react-use"
import { getSafeFoldersFromDirectory } from "@/lib/helpers/directory"
import { FcOpenedFolder } from "@react-icons/all-files/fc/FcOpenedFolder"
import { BiCheck } from "@react-icons/all-files/bi/BiCheck"
import { BiFolderPlus } from "@react-icons/all-files/bi/BiFolderPlus"

interface DirectoryInputProps {
    children?: React.ReactNode
    value: string | undefined
    onSelect: (value: string) => void
    prefix?: string
    directoryShouldExist?: boolean // TODO
}

export const DirectoryInput: React.FC<DirectoryInputProps> = (props) => {

    const { children, value, prefix, ...rest } = props

    const [inputValue, setInputValue] = useState(prefix ? value?.replace(prefix + "\\", "") || "" : (value || ""))
    const debouncedValue = useDebounce(inputValue, 1000)
    const valueRef = useRef(inputValue)

    const folders = useAsync(async () => {
        const val = prefix ? (prefix + "\\" + debouncedValue) : debouncedValue
        if (val.length > 0) {
            const res = await getSafeFoldersFromDirectory(val)
            console.log(res)
            return res
        } else {
            return { data: [], error: null }
        }
    }, [debouncedValue])


    const handleSelectDir = useCallback((path: string) => {
        let _path = prefix ? path.replace(prefix + "\\", "") : path
        _path = _path.startsWith("\\") ? _path.substring(1) : _path
        _path = _path.replaceAll("\\\\", "\\")
        setInputValue(_path)
        valueRef.current = _path
    }, [])
    return (
        <>
            <TextInput
                leftIcon={<FcOpenedFolder className={"text-2xl"}/>}
                leftAddon={prefix ? prefix : undefined}
                value={inputValue}
                onChange={e => {
                    setInputValue(e.target.value)
                }}
                rightIcon={!folders.value?.error ? <BiCheck className={"text-green-500"}/> : <BiFolderPlus/>}
                onBlur={() => {
                    startTransition(() => {
                        setTimeout(() => {
                            if (inputValue.length === 0) {
                                setInputValue(valueRef.current)
                            }
                        }, 500)
                    })
                }}
            />
            {!!(folders.value?.data.length && folders.value?.data.length > 0) &&
                <div className={"w-full flex flex-none flex-nowrap overflow-x-auto pb-2 gap-2"}>
                    {folders.value?.data.map(folder => (
                        <div
                            key={folder.name}
                            className={"py-1 px-3 rounded-md border border-[--border] flex-none cursor-pointer bg-gray-900 hover:bg-gray-800"}
                            onClick={() => handleSelectDir(folder.path)}
                        >
                            {folder.name}
                        </div>
                    ))}
                </div>}
        </>
    )

}
