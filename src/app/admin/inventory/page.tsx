// src/app/admin/inventory/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { calculateAllStock } from "@/lib/inventory-stock";
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
  totalPurchased: number;
  totalSold: number;
}

export default async function InventoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = String((session.user as any).role || "staff").toLowerCase();

  let items: InventoryItem[] = [];
  try {
    const sheet = await getSheet(SHEETS.INVENTORY);
    const rows = await sheet.getRows();

    // ✅ Calculate stock from Stock_In_TBL - Sales_Items_TBL
    const stockMap = await calculateAllStock();

    items = rows
      .map((r) => {
        const obj = r.toObject() as any;
        const itemId = String(obj.Item_ID || obj.ItemID || obj.id || "");

        // Get calculated stock
        const calc = stockMap[itemId];
        const totalPurchased = calc?.totalPurchased ?? 0;
        const totalSold = calc?.totalSold ?? 0;
        const stock = calc?.currentStock ?? 0;

        // Also read Stock_Quantity (in case it's filled)
        const sheetStock = Number(
          obj.Stock_Quantity ?? obj.StockQuantity ?? obj.Stock ?? 0
        ) || 0;

        // Use whichever is bigger — calculated or sheet value
        const finalStock = Math.max(stock, sheetStock);

        const costRaw =
          obj.Cost_Price ?? obj.CostPrice ?? obj.costPrice ??
          obj.Avg_Cost ?? obj.AvgCost ?? 0;
        const costPrice = Number(costRaw) || 0;

        const sellRaw =
          obj.Selling_Price ?? obj.SellingPrice ?? obj.sellingPrice ??
          obj.Price ?? obj.price ?? 0;
        const sellingPrice = Number(sellRaw) || 0;

        const reorderRaw = obj.Reorder_Level ?? obj.ReorderLevel ?? 10;
        const reorderLevel = Number(reorderRaw) || 10;

        return {
          id: itemId,
          name: String(obj.Item_Name || obj.ItemName || obj.name || ""),
          code: String(obj.Item_Code || obj.ItemCode || obj.code || ""),
          category: String(obj.Category || obj.category || obj.Unit_Type || "General"),
          image: String(obj.Item_Image || obj.ItemImage || obj.image || ""),
          stock: finalStock,
          costPrice,
          sellingPrice,
          avgCost: Number(obj.Avg_Cost || obj.AvgCost || costRaw) || costPrice,
          unitType: String(obj.Unit_Type || obj.UnitType || "pcs"),
          reorderLevel,
          status: String(obj.Status || obj.status || "Active"),
          supplierId: String(obj.Supplier_ID || obj.SupplierID || ""),
          date: String(obj.Date || obj.date || ""),
          totalPurchased,
          totalSold,
        };
      })
      .filter((i) => i.status !== "Archived" && i.name);
  } catch (e) {
    console.error("Inventory load error:", e);
  }

  return <InventoryClient initialItems={items} userRole={role} />;
}
