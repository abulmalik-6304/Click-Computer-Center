// src/app/admin/inventory/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import InventoryClient from "./InventoryClient";

export const revalidate = 0;

export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: string;
  image: string;
  stock: number;
  costPrice: number;
  sellingPrice: number;
  avgCost: number;
  unitType: string;
  reorderLevel: number;
  status: string;
  supplierId: string;
  date: string;
}

export default async function InventoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = String((session.user as any).role || "staff").toLowerCase();

  let items: InventoryItem[] = [];
  try {
    const sheet = await getSheet(SHEETS.INVENTORY);
    const rows = await sheet.getRows();
    items = rows
      .map((r) => {
        const obj = r.toObject() as any;
        return {
          id: String(obj.Item_ID || ""),
          name: String(obj.Item_Name || ""),
          code: String(obj.Item_Code || ""),
          category: String(obj.Category || obj.Unit_Type || "General"),
          image: String(obj.Item_Image || ""),
          stock: Number(obj.Stock_Quantity || 0),
          costPrice: Number(obj.Cost_Price || 0),
          sellingPrice: Number(obj.Selling_Price || 0),
          avgCost: Number(obj.Avg_Cost || obj.Cost_Price || 0),
          unitType: String(obj.Unit_Type || "pcs"),
          reorderLevel: Number(obj.Reorder_Level || 10),
          status: String(obj.Status || "Active"),
          supplierId: String(obj.Supplier_ID || ""),
          date: String(obj.Date || ""),
        };
      })
      .filter((i) => i.status !== "Archived");
  } catch {
    items = [];
  }

  return <InventoryClient initialItems={items} userRole={role} />;
}
