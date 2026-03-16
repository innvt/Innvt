import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three', 'lenis'],
  experimental: {
    optimizePackageImports: ['three', 'gsap', 'lucide-react'],
  },
};

export default nextConfig;
