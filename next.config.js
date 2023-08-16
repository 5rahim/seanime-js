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
        ]
    },
}

module.exports = nextConfig
