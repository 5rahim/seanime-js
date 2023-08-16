"use client"

import React from "react"
import { cn, ComponentWithAnatomy, defineStyleAnatomy } from "@/components/ui/core"
import { cva } from "class-variance-authority"
import { useMatchingRecommendationGroups, useStoredLocalFilesWithNoMatch } from "@/atoms/library"
import { Drawer } from "@/components/ui/modal"

/* -------------------------------------------------------------------------------------------------
 * ClassificationRecommendationHub
 * -----------------------------------------------------------------------------------------------*/


export function ClassificationRecommendationHub(props: { isOpen: boolean, close: () => void }) {

    const { getRecommendations } = useStoredLocalFilesWithNoMatch()
    const { groups } = useMatchingRecommendationGroups()

    return (
        <Drawer
            isOpen={props.isOpen}
            onClose={props.close}
            size={"xl"}
            isClosable
            title={"Resolve unmatched files"}
        >

        </Drawer>
    )

}
