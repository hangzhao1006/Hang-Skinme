/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    output: 'export', // Enable static HTML export for Capacitor
    images: {
        unoptimized: true, // Required for static export
    },
    // Add trailing slash for better Capacitor compatibility
    trailingSlash: true,
    webpack: (config) => {
        config.module.rules.push({
            test: /\.svg$/,
            use: ["@svgr/webpack"]
        });
        return config;
    },
};

module.exports = nextConfig;
