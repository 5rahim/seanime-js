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

interface MainSidebarProps {
    children?: React.ReactNode
}

export const MainSidebar: React.FC<MainSidebarProps> = (props) => {

    const { children, ...rest } = props

    const { isAuthed } = useAuthed()
    const { authenticate } = useAnilistLogin()

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
                        { icon: RiHome2Line, name: "Test", href: "/" },
                    ]}/>
                </div>
                <div>
                    {!isAuthed && (
                        <div>
                            <VerticalNav items={[
                                {
                                    icon: FiLogIn, name: "Test", onClick: () => loginModal.open(),
                                },
                            ]}/>
                        </div>
                    )}
                    {isAuthed && <div className={"flex w-full justify-center"}>
                        <DropdownMenu trigger={<div className={"pt-1"}>
                            <Avatar size={"sm"} className={"cursor-pointer"}/>
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
