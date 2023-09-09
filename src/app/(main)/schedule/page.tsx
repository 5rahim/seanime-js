"use client"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { UndownloadedEpisodes } from "@/app/(main)/schedule/_containers/missed-episodes/missed-episodes"

export default function Page() {

    return (
        <div className={"px-4 pt-8 space-y-10"}>
            <AppLayoutStack>
                <h2>New episodes</h2>
                <UndownloadedEpisodes/>
            </AppLayoutStack>
            <h2>Coming up next</h2>
            {/*Next airing episodes from currently watching (à la Moopa)*/}
            <h2>Releases</h2>
            {/*New releases from other media (à la Crunchyroll New section)*/}
        </div>
    )
}
