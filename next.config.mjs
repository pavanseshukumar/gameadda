/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // iTunes cover art for Guess the Song (is1-ssl.mzstatic.com, is2-…, etc.).
    remotePatterns: [{ protocol: "https", hostname: "**.mzstatic.com", pathname: "/image/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
