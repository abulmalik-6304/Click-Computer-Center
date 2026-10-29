// src/app/admin/export/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { buildEnrichedSales, mapExpenseRow, mapInventoryRow } from "@/lib/data-mappers";
import ExportClient from "./ExportClient";

export const revalidate = 0;

export default async function ExportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = String((session.user as any).role || "staff").toLowerCase();
  if (!["owner", "manager"].includes(role)) redirect("/admin/dashboard");

  let sales: any[] = [];
  let inventory: any[] = [];
  let expenses: any[] = [];
  let users: any[] = [];
  let employees: any[] = [];

  try {
    const [salesSheet, itemSheet] = await Promise.all([
      getSheet(SHEETS.SALES),
      getSheet(SHEETS.SALES_ITEMS),
    ]);
    const [salesRows, itemRows] = await Promise.all([
      salesSheet.getRows(),
      itemSheet.getRows(),
    ]);
    sales = buildEnrichedSales(
      salesRows.map((r) => r.toObject()),
      itemRows.map((r) => r.toObject())
    );

    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();
    inventory = invRows.map((r) => mapInventoryRow(r.toObject()));

    const expSheet = await getSheet(SHEETS.EXPENSES);
    const expRows = await expSheet.getRows();
    expenses = expRows.map((r) => mapExpenseRow(r.toObject()));

    const userSheet = await getSheet(SHEETS.USERS);
    const userRows = await userSheet.getRows();
    users = userRows.map((r) => r.toObject());

    try {
      const empSheet = await getSheet(SHEETS.EMPLOYEES);
      const empRows = await empSheet.getRows();
      employees = empRows.map((r) => r.toObject());
    } catch {
      employees = [];
    }
  } catch (e) {
    console.error("Export load error:", e);
  }

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
