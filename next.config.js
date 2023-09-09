/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: true,
    },
    swcMinify: true,
    images: {
        remotePatterns: [
            {hostname: "s4.anilist.co"},
            {hostname: "cdn.myanimelist.net"},
            {hostname: "artworks.thetvdb.com"},
            {hostname: "media.kitsu.io"},
            {hostname: "simkl.in"},
            {hostname: "img1.ak.crunchyroll.com"},
        ]
    },
}

module.exports = nextConfig
