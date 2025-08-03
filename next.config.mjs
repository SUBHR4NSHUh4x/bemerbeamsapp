/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static optimization where possible
  reactStrictMode: true,
  // Optimize images
  images: {
    domains: ['clerk.com'],
    minimumCacheTTL: 60,
  },
  // Environment variables that will be available at build time
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    MONGO_URL: process.env.MONGO_URL,
  },
  // Increase serverless function timeout for database operations
  serverRuntimeConfig: {
    // Using process.cwd() instead of __dirname for ESM compatibility
    PROJECT_ROOT: process.cwd(),
  },
};

export default nextConfig;
