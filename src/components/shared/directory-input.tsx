"use client"
import React, { startTransition, useCallback, useEffect, useRef, useState } from "react"
import { TextInput, TextInputProps } from "@/components/ui/text-input"
import { useDebounce } from "@/hooks/use-debounce"
import { useAsync, useUpdateEffect } from "react-use"
import { getSafeFoldersFromDirectory } from "@/lib/helpers/directory"
import { FcOpenedFolder } from "@react-icons/all-files/fc/FcOpenedFolder"
import { BiCheck } from "@react-icons/all-files/bi/BiCheck"
import { BiFolderPlus } from "@react-icons/all-files/bi/BiFolderPlus"
import { BiX } from "@react-icons/all-files/bi/BiX"
import { path_join, path_removeTopPath } from "@/lib/helpers/path"

export interface DirectoryInputProps {
    children?: React.ReactNode
    value: string | undefined
    onSelect: (value: string) => void
    // Path that will be added before the input value
    prefix?: string
    // Only allow existing directories
    directoryShouldExist?: boolean
    // Show sub-folders
    showSubfolders?: boolean
}

export const DirectoryInput: React.FC<DirectoryInputProps & Omit<TextInputProps, "value" | "onChange" | "onSelect">> = React.forwardRef((props, ref) => {

    const { children, value, prefix, directoryShouldExist, onSelect, showSubfolders = true, ...rest } = props

    // track input path
    const [inputValue, setInputValue] = useState(
        // default path is the value prop without the prefix
        (prefix && value) ? path_removeTopPath(value, prefix) || "" : (value || ""),
    )

    // debounced value that will be used to fetch folders from server
    const debouncedPath = useDebounce(inputValue, 1000)
    // keep track of the last valid value
    const valueRef = useRef(inputValue)

    function formatAbsolutePath(path: string) {
        return prefix ? path_join(prefix, path) : path
    }

    useUpdateEffect(() => {
        if (!!value && inputValue === "") { // watch for external value changes when input is empty
            setInputValue((prefix && value) ? path_removeTopPath(value, prefix) || "" : (value || ""))
        }
    }, [value])

    // fetched folders
    const folders = useAsync(async () => {
        // format path that will be used to fetch folders
        const _path = formatAbsolutePath(debouncedPath) // add prefix if needed
        if (_path.length > 0) {
            return await getSafeFoldersFromDirectory(_path)
        } else {
            return { data: [], error: null }
        }
    }, [debouncedPath])

    // handle selection of a sub-folder
    const handleSelectDir = useCallback((input: string) => {
        // format the new input value (without prefix)
        let _inputPath = prefix ? path_removeTopPath(input, prefix) : input
        // format the returned path (with prefix if needed)
        let _path = path_join(inputValue, input)
        // actions
        setInputValue(_inputPath) // change input value
        valueRef.current = _inputPath // update last valid value
        onSelect(_path) // emit update
    }, [prefix, inputValue])

    useEffect(() => {
        const _path = formatAbsolutePath(debouncedPath)
        if (folders.value) {
            if (directoryShouldExist && !folders.value.error) {
                onSelect(_path)
            } else if (!directoryShouldExist) {
                onSelect(_path)
            }
        }
    }, [debouncedPath, folders])

    async function checkDirectory() {
        const res = await getSafeFoldersFromDirectory(inputValue)
        if (!!res.error) setInputValue(valueRef.current)
    }


    return (
        <div className={"space-y-1"}>
            <TextInput
                leftIcon={<FcOpenedFolder className={"text-2xl"}/>}
                leftAddon={prefix ? prefix : undefined}
                value={inputValue}
                rightIcon={!folders.value?.error ? <BiCheck className={"text-green-500"}/> : directoryShouldExist ?
                    <BiX className={"text-red-500"}/> : <BiFolderPlus/>}
                {...rest}
                onChange={e => {
                    setInputValue(e.target.value)
                }}
                onBlur={() => {
                    startTransition(() => {
                        // if (inputValue.length === 0) {
                        //     setTimeout(() => {
                        //         setInputValue(valueRef.current)
                        //     }, 500)
                        // }
                        if (directoryShouldExist) {
                            setTimeout(() => {
                                checkDirectory()
                            }, 200)
                        }
                    })
                }}
            />
            {!!(folders.value?.data.length && folders.value?.data.length > 0 && showSubfolders) &&
                <div
                    className={"w-full flex flex-none flex-nowrap overflow-x-auto gap-2 items-center bg-gray-800 rounded-md p-1 px-4"}>
                    <div className={"flex-none"}>Sub-folders:</div>
                    {folders.value?.data.map(folder => (
                        <div
                            key={folder.name}
                            className={"py-1 text-sm px-3 rounded-md border border-[--border] flex-none cursor-pointer bg-gray-900 hover:bg-gray-800"}
                            onClick={() => handleSelectDir(folder.path)}
                        >
                            {folder.name}
                        </div>
                    ))}
                </div>}
        </div>
    )

})
