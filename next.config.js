/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    swcMinify: true,
    experimental: {
        serverActions: true,
    },
    images: {
        unoptimized: true,
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
