import { getFolders } from "@/cli/folders";
import { openSomething } from "@/app/_actions/example";
import { Button } from "@/app/button";

export default async function Page() {

   const folders = await getFolders()


    return (
        <>
           <pre>{JSON.stringify(folders, null, 2)}</pre>
            <Button />
        </>
    )
}
