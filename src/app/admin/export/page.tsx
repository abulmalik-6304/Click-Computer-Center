// src/app/admin/export/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ExportClient from "./ExportClient";

// ─── Google Sheets ወይም የኢንጂን ዳታዎችን እዚህ እናመጣለን ───
export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  // ለጊዜው የናሙና ወይም የሰርቨር ዳታ ድርድር እንልካለን (ከ Google Sheets ጋር በቀላሉ ይያያዛል)
  const sales: any[] = [];
  const inventory: any[] = [];
  const expenses: any[] = [];
  const users: any[] = [];
  const employees: any[] = [];

  return (
    <ExportClient
      sales={sales}
      inventory={inventory}
      expenses={expenses}
      users={users}
      employees={employees}
    />
  );
}
