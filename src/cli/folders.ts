import fs from "fs/promises"

export const getFolders = async () => {

    const folders = await fs.readdir('E:\\ANIME')

    return folders.map(folder => folder)

}
