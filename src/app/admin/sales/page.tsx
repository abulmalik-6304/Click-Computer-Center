// src/app/admin/sales/page.tsx
import { getSheet, SHEETS } from "@/lib/google-sheets";
import SalesPOS from "./SalesPOS";

export const revalidate = 0;

export default async function SalesPage() {
  let inventory: any[] = [];
  let recentSales: any[] = [];
  try {
    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();
    inventory = invRows
      .map((r) => r.toObject())
      .filter((i: any) => i.Status !== "Archived" && Number(i.Stock_Quantity ?? 0) > 0);

    const salesSheet = await getSheet(SHEETS.SALES);
    const salesRows = await salesSheet.getRows();
    recentSales = salesRows
      .map((r) => r.toObject())
      .sort((a: any, b: any) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
      .slice(0, 10);
  } catch (e) {
    console.error("Sales load error:", e);
  }

  return <SalesPOS inventory={inventory} recentSales={recentSales} />;
}
