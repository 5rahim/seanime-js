"use client"

import { AppLayoutStack } from "@/components/ui/app-layout"
import { MissedEpisodes } from "@/app/(main)/schedule/_containers/missed-episodes/missed-episodes"
import { ComingUpNext } from "@/app/(main)/schedule/_containers/coming-up-next/coming-up-next"
import { RecentReleases } from "@/app/(main)/schedule/_containers/recent-releases/recent-releases"
import { useRefreshAnilistCollection } from "@/atoms/anilist/collection.atoms"
import { useMount } from "react-use"

export default function Page() {

    const refetchCollection = useRefreshAnilistCollection()
    useMount(() => {
        refetchCollection({ muteAlert: true })
    })

    return (
        <div className={"px-4 pt-8 space-y-10 pb-10"}>
            <AppLayoutStack>
                <MissedEpisodes/>
            </AppLayoutStack>
            <AppLayoutStack>
                <ComingUpNext/>
            </AppLayoutStack>
            <AppLayoutStack>
                <h2>Recent releases</h2>
                <RecentReleases/>
            </AppLayoutStack>
            {/*New releases from other media (à la Crunchyroll New section)*/}
        </div>
    )
}
