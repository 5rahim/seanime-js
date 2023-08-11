"use client"
import React, { useMemo } from "react"
import { usePathname } from "next/navigation"
import { useAuthed } from "@/atoms/auth"
import { useCurrentUser } from "@/atoms/user"
import { NavigationTabs } from "@/components/ui/tabs"
import Image from "next/image"

export default function Layout({ children }: {
   children: React.ReactNode,
}) {

   const pathname = usePathname()
   const { isAuthed } = useAuthed()
   const { user } = useCurrentUser()

   const navigationItems = useMemo(() => {
      const authedItems = isAuthed ? [
         {
            href: "/anilist",
            icon: null,
            isCurrent: pathname.includes("/anilist"),
            name: "Watch lists",
         },
      ] : []

      return [
         {
            href: "/",
            icon: null,
            isCurrent: pathname === "/",
            name: "My library",
         },
         ...authedItems,
      ]
   }, [isAuthed, pathname])

   return (
       <main className="min-h-screen">
          <div className={"w-full h-[8rem] relative overflow-hidden pt-[--titlebar-h]"}>
             <div className="relative z-10 px-4 w-full flex justify-between items-center">
                <NavigationTabs
                    className="p-0"
                    iconClassName=""
                    tabClassName="text-xl"
                    items={navigationItems}
                />
                <div>
                   {isAuthed && (
                       <p>{user?.name}</p>
                   )}
                </div>
             </div>
             {!pathname.includes("/anilist") && <Image
                 src={"/landscape-beach.jpg"}
                 alt={"tenki no ko"}
                 fill
                 priority
                 className={"object-cover object-top"}
             />}
             {pathname.includes("/anilist") && <Image
                 src={"/landscape-tenki-no-ko.jpg"}
                 alt={"tenki no ko"}
                 fill
                 priority
                 className={"object-cover"}
             />}
             <div
                 className={"w-full absolute bottom-0 h-[20rem] bg-gradient-to-t from-[--background-color] to-transparent"}/>
          </div>

          <div>
             {children}
          </div>

       </main>
   )

}
