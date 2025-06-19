/** @type {import('next').NextConfig} */

const nextConfig =  {
  images: {
    domains: ["s3.sellerpintar.com"],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;