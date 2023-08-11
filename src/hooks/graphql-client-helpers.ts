"use client"

import { type TypedDocumentNode } from "@graphql-typed-document-node/core"
import {
    useMutation,
    UseMutationOptions,
    UseMutationResult,
    useQuery,
    UseQueryOptions,
    type UseQueryResult,
} from "@tanstack/react-query"
import { print } from "graphql"
import { useEffect } from "react"
import { toast } from "react-hot-toast"
import { Variables } from "graphql-request"
import { useAniListGraphQLClient } from "@/lib/anilist/graphql-client"

/**
 * @example
 * const res = useClientQuery( GetStores )
 * const data = res.data?.stores ?? []
 * @param document
 * @param variables
 * @param options
 */
export function useAniListClientQuery<TResult, TVariables extends Variables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables,
    options?: UseQueryOptions<TResult, unknown, TResult, any[]>,
): UseQueryResult<TResult> {
    const client = useAniListGraphQLClient()
    const res = useQuery([(document.definitions[0] as any).name.value, variables],
        async () => {
            return client.request(print(document), variables) as TResult
        },
        options,
    )

    useEffect(() => {
        if (res.failureCount === 1 || res.isError) {
            handleErrors(res.failureReason, "Error/Erreur", false)
        }
    }, [res.status])

    return res
}

export function useAniListClientMutation<TResult, TVariables extends Variables>(
    document: TypedDocumentNode<TResult, TVariables>,
    options?: UseMutationOptions<TResult, unknown, TVariables, any[]>,
): UseMutationResult<TResult, unknown, TVariables> {
    const client = useAniListGraphQLClient()
    const res = useMutation([(document.definitions[0] as any).name.value],
        async (variables?: TVariables) => {
            return client.request(print(document), variables) as TResult
        },
        options,
    )

    useEffect(() => {
        if (res.failureCount === 1 || res.isError) {
            handleErrors(res.failureReason, "Error/Erreur", false)
        }
    }, [res.status])

    return res
}

export const handleErrors = (error: any, message: string = "An error has occurred", debug: boolean) => {

    process.env.NODE_ENV === "development" && console.error("[Error]: ", error)

    const additionalDetails = process.env.NODE_ENV === "development" ? error?.message : undefined

    toast.dismiss()
    //
    toast.error(message, {
        position: "top-center",
        // description: additionalDetails,
    })

    throw new Error(error)

}
