// src/app/admin/reports/page.tsx
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { buildEnrichedSales, mapExpenseRow } from "@/lib/data-mappers";
import ReportsClient from "./ReportsClient";

export const revalidate = 0;

export default async function ReportsPage() {
  let sales: any[] = [];
  let expenses: any[] = [];

  try {
    const salesSheet = await getSheet(SHEETS.SALES);
    const itemSheet = await getSheet(SHEETS.SALES_ITEMS);
    const [salesRows, itemRows] = await Promise.all([
      salesSheet.getRows(),
      itemSheet.getRows(),
    ]);
    sales = buildEnrichedSales(
      salesRows.map((r) => r.toObject()),
      itemRows.map((r) => r.toObject())
    );

    const expSheet = await getSheet(SHEETS.EXPENSES);
    const expRows = await expSheet.getRows();
    expenses = expRows.map((r) => mapExpenseRow(r.toObject()));
  } catch (e) {
    console.error("Reports load error:", e);
  }

  return <ReportsClient sales={sales} expenses={expenses} />;
}
