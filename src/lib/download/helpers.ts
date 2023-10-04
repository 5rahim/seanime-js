import { Nullish } from "@/types/common"

/**
 * Get torrent hash string from magnet link
 * @param magnetLink
 */
export function extractHashFromMagnetLink(magnetLink: Nullish<string>) {
    const match = magnetLink?.match(/magnet:\?xt=urn:btih:([^&]+)/)
    if (match && match[1]) {
        return match[1]
    } else {
        return null // Magnet link format not recognized or no hash found
    }
}
