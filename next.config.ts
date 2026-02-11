import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Google 프로필 이미지 로딩 허용
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
