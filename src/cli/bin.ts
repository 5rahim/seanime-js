import { getFolders } from "@/cli/folders";

export const main = async () => {
    const folders = await getFolders()
    console.log(folders)
}

main().then().catch()
