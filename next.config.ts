// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: true,
        serverComponentsExternalPackages: ["mongoose"], // this tells it how to build the mongoose actions
    },

    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "img.clerk.com",
            },
            {
                protocol: "https",
                hostname: "images.clerk.dev",
            },
            {
                protocol: "https",
                hostname: "uploadthing.com",
            },
            {
                protocol: "https",
                hostname: "placehold.co",
            },
        ],
    },

    typescript: {
        ignoreBuildErrors: true,
    },
}

export default nextConfig
