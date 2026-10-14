import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Click Computer Center - Dashboard",
  description: "የፋይናንስ፣ የኢንቨንተሪ እና የትርፍ መቆጣጠሪያ ዌብ ፖርታል",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="am">
      <body className="antialiased bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
