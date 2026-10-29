import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "drive.google.com" },
    ],
  },

  // ✅ pdfkit ን ከTurbopack ሸሽግ (fontkit compatibility)
  serverExternalPackages: ["pdfkit"],

  // ✅ የPDF ፎንት ፋይሎች ከbuild ጋር እንዲካተቱ
  outputFileTracingIncludes: {
    "/api/export": [
      "node_modules/pdfkit/js/data/*.afm",
      "node_modules/pdfkit/js/standard-fonts/*.cjs",
    ],
  },
};

export default nextConfig;
