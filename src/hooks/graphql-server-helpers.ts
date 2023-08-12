import { type TypedDocumentNode } from "@graphql-typed-document-node/core"
import { print } from "graphql"
import { Variables } from "graphql-request"
import { getAniListGraphQLClient } from "@/lib/anilist/graphql-client"


/**
 * @example
 * const res = useServerQuery(GetStores)
 * const stores = data.stores ?? []
 * @param document
 * @param variables
 * @param token
 */
export async function useAniListAsyncQuery<TResult, TVariables extends Variables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables,
    token?: string,
): Promise<TResult> {

    const res = await getAniListGraphQLClient(token).rawRequest<TResult, TVariables>(print(document), variables)

    if (res.status !== 200) {
        throw new Error(`Failed to fetch: ${res.status}. Body: ${res.errors?.join(", ")}`)
    }

    return res.data

}
