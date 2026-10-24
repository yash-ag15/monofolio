// Analytics go through our own domain (/ingest → PostHog), so ad blockers that block posthog.com don't drop them.
// The region follows NEXT_PUBLIC_POSTHOG_HOST (us.i.posthog.com or eu.i.posthog.com).
const posthogHost = (process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/$/, '');
const posthogAssets = posthogHost.replace('://us.i.', '://us-assets.i.').replace('://eu.i.', '://eu-assets.i.');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    // pdf.js has an optional Node-only dependency that the browser build never uses
    config.resolve.alias.canvas = false;
    return config;
  },
  async rewrites() {
    return [
      { source: '/ingest/static/:path*', destination: `${posthogAssets}/static/:path*` },
      { source: '/ingest/array/:path*', destination: `${posthogAssets}/array/:path*` },
      { source: '/ingest/:path*', destination: `${posthogHost}/:path*` },
    ];
  },
  skipTrailingSlashRedirect: true, // PostHog's endpoints end in "/"
};

export default nextConfig;
