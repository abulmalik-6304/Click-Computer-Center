import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ✅ TypeScript ስህተቶች በ build ጊዜ እንዳያቆሙ
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ✅ ESLint ስህተቶች በ build ጊዜ እንዳያቆሙ
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // ያለህ ሌላ config ካለ እዚህ ይቀጥል...
};

export default nextConfig;
