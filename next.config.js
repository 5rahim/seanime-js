/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: true,
    },
    swcMinify: true,
    images: {
        unoptimized: true,
        remotePatterns: [
            {hostname: "s4.anilist.co"},
            {hostname: "cdn.myanimelist.net"},
            {hostname: "artworks.thetvdb.com"},
        ]
    },
}

module.exports = nextConfig
