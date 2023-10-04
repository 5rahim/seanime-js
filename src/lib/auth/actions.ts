"use server"
import { cookies } from "next/headers"

/* -------------------------------------------------------------------------------------------------
 * Anilist Authentication
 * -----------------------------------------------------------------------------------------------*/

export async function authenticateUser(token: string) {
    // Cookie will last one week
    cookies().set("anilistToken", token, {
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
    })
}

export async function userIsAuthenticated() {
    return cookies().has("anilistToken")
}

export async function logoutUser() {
    cookies().delete("anilistToken")
}

export async function getAniListUserToken() {
    return cookies().get("anilistToken")?.value
}
