"use server"
import OpenAI from "openai"
import { fileSnapshot } from "@/lib/local-library/mock"
// import { encode } from "gpt-3-encoder"

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function parseLocalFilesToLibraryEntry(paths?: string[]) {

    const _paths = fileSnapshot.map(n => n.path).slice(0, 50)

    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: "Answer in a consistent style." },
            {
                role: "system", content: `
                You will be provided with an array of file paths, and your task is to extract the most likely anime title, the episode number and from the file path and the season either from the file name or the parent folders.
                Parse it into a JavaScript array format like this: 
                [
                    { "title": "<insert title here>", "season": "<insert season here>", "episode": "<insert episode here>" },
                    ...
                ]
            `,
            },
            { role: "user", content: JSON.stringify(_paths) },
        ],
        temperature: 0,
        max_tokens: 2048,
    })

    return completion.choices[0]

}
