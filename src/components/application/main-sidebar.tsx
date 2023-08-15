"use client"
import React from "react"
import { VerticalNav } from "@/components/ui/vertical-nav"
import { AppSidebar } from "@/components/ui/app-layout"
import { RiHome2Line } from "@react-icons/all-files/ri/RiHome2Line"
import { Avatar } from "@/components/ui/avatar"
import { loginSchema, useAnilistLogin, useAuthed } from "@/atoms/auth"
import { ANILIST_OAUTH_URL } from "@/lib/anilist/config"
import { FiLogIn } from "@react-icons/all-files/fi/FiLogIn"
import { useDisclosure } from "@/hooks/use-disclosure"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Field, TypesafeForm } from "@/components/ui/typesafe-form"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useCurrentUser } from "@/atoms/user"
import { usePathname } from "next/navigation"
import { FiSettings } from "@react-icons/all-files/fi/FiSettings"
import { FiSearch } from "@react-icons/all-files/fi/FiSearch"

interface MainSidebarProps {
    children?: React.ReactNode
}

export const MainSidebar: React.FC<MainSidebarProps> = (props) => {

    const { children, ...rest } = props

    const { isAuthed } = useAuthed()
    const { authenticate } = useAnilistLogin()
    const { user } = useCurrentUser()
    const pathname = usePathname()

    const loginModal = useDisclosure(false)

    return (
        <>
            <AppSidebar className={"p-4 h-full flex flex-col justify-between"} sidebarClassName="h-full">
                <div>
                    <div className={"mb-8 flex justify-center w-full"}>
                        {/*<p className={"text-2xl font-bold w-full text-center text-brand"}>Sea</p>*/}
                        <img src="/android-chrome-192x192.png" alt="logo" className={"w-10 h-10"}/>
                    </div>
                    <VerticalNav items={[
                        { icon: RiHome2Line, name: "Home", href: "/", isCurrent: pathname === "/" },
                        { icon: FiSearch, name: "Search", href: "/", isCurrent: pathname === "/search" },
                    ]}/>
                </div>
                <div className={"flex w-full gap-2 flex-col"}>
                    <div>
                        <VerticalNav items={[
                            {
                                icon: FiSettings,
                                name: "Settings",
                                href: "/settings",
                                isCurrent: pathname.includes("/settings"),
                            },
                        ]}/>
                    </div>
                    {!isAuthed && (
                        <div>
                            <VerticalNav items={[
                                {
                                    icon: FiLogIn, name: "Login", onClick: () => loginModal.open(),
                                },
                            ]}/>
                        </div>
                    )}
                    {isAuthed && <div className={"flex w-full gap-2 flex-col"}>
                        <DropdownMenu trigger={<div className={"pt-1 w-full flex justify-center"}>
                            <Avatar size={"sm"} className={"cursor-pointer"} src={user?.avatar?.medium || ""}/>
                        </div>}>
                            <DropdownMenuItem onClick={() => authenticate(undefined)}>
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenu>
                    </div>}
                </div>
            </AppSidebar>

            <Modal title={"Login"} isOpen={loginModal.isOpen} onClose={loginModal.close} isClosable>
                <div className={"mt-5 text-center space-y-4"}>
                    <Button onClick={() => {
                        window.open(ANILIST_OAUTH_URL, "_blank", "popup")
                    }} intent={"primary-outline"}>Login with AniList</Button>
                    <div className={""}>
                        <TypesafeForm
                            schema={loginSchema}
                            onSubmit={data => {
                                authenticate(data.token)
                                loginModal.close()
                            }}
                        >
                            <Field.Textarea name={"token"} className={"h-24"}/>
                            <Field.Submit intent={"primary"}>Login</Field.Submit>
                        </TypesafeForm>
                    </div>
                </div>
            </Modal>
        </>
    )

}
