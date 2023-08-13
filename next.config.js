/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: true,
    },
    swcMinify: true,
    images: {
        remotePatterns: [
            {hostname: "s4.anilist.co"}
        ]
    },
}

module.exports = nextConfig
