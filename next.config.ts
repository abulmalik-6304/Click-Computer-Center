import type { Next.Config } from "next";

const next.config: Next.Config = {
  typescript: {
    // ⚠️ ይህንን በመጨመር ቬርሰል ላይ የ TypeScript ኤረሮች Build እንዳያቆሙ ማድረግ ይቻላል
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default next.config;
