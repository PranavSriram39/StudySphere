/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["res.cloudinary.com"],
  },

  webpack: (config) => {
    config.resolve.fallback = {
      bufferutil: false,
      "utf-8-validate": false,
    };
    return config;
  },
};

module.exports = nextConfig;
