/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    // pdf.js has an optional Node-only dependency that the browser build never uses
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
