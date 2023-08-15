import "@total-typescript/ts-reset"

declare module "anitomyscript" {
    function anitomyscript(fileName: string): Promise<any>

    export = anitomyscript
}

// declare module "js-levenshtein" {
//     function levenshtein(firstValue: string, secondValue: string): number
//     export = levenshtein
// }
