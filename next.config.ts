import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["satellite.js"],
  // Strict Mode double-mounts the tree in dev, which remounts the WebGL canvas
  // and looks like the app “opens twice.”
  reactStrictMode: false,
  devIndicators: false,
  // Dev only: phone/tablet on the LAN must load /_next/* (otherwise 403 and no sats).
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
    "*.local",
  ],
  // Safe cache: long-lived textures, short icon cache, always revalidate HTML/JS.
  headers: async () => [
    {
      source: "/:path*.:ext(jpg|jpeg|webp|gif|geojson|woff2?)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      source: "/:path*.:ext(png|svg|ico)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=604800, stale-while-revalidate=86400",
        },
      ],
    },
    {
      source: "/:path*.:ext(js|css|webmanifest|json|html)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
      ],
    },
    {
      source: "/",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
      ],
    },
  ],
};

export default nextConfig;
