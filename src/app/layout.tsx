import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Click Computer Center - Dashboard",
  description: "የፋይናንስ እና የኢንቨንተሪ መቆጣጠሪያ ዌብ ፖርታል",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="am">
      <body className="antialiased bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
