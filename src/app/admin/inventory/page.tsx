// src/app/admin/inventory/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { calculateAllStock } from "@/lib/inventory-stock";
import { getManagerPermissions, hasPermission } from "@/lib/permissions";
import InventoryClient from "./InventoryClient";

export const revalidate = 0;
export const dynamic = "force-dynamic"; // ✅ ሁልጊዜ fresh data

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
    const stockMap = await calculateAllStock();

    items = rows
      .map((r) => {
        const obj = r.toObject() as any;
        const itemId = String(obj.Item_ID || "");
        const calc = stockMap[itemId];
        const totalPurchased = calc?.totalPurchased ?? 0;
        const totalSold = calc?.totalSold ?? 0;
        const stock = calc?.currentStock ?? 0;

        return {
          id: itemId,
          name: String(obj.Item_Name || ""),
          code: String(obj.Item_Code || ""),
          category: String(obj.Category || obj.Unit_Type || "General"),
          image: String(obj.Item_Image || ""),
          stock,
          costPrice: Number(obj.Cost_Price || 0),
          sellingPrice: Number(obj.Selling_Price || 0),
          avgCost: Number(obj.Avg_Cost || obj.Cost_Price || 0),
          unitType: String(obj.Unit_Type || "pcs"),
          reorderLevel: Number(obj.Reorder_Level || 10),
          status: String(obj.Status || "Active"),
          supplierId: String(obj.Supplier_ID || ""),
          date: String(obj.Date || ""),
          totalPurchased,
          totalSold,
        };
      })
      .filter((i) => i.status !== "Archived" && i.name);
  } catch (e) {
    console.error("Inventory load error:", e);
  }

  // ✅ Calculate permissions for this user
  const email = String(session.user?.email || "");
  const canEdit = await hasPermission(email, role, "canEditInventory");

  return (
    <InventoryClient
      initialItems={items}
      userRole={role}
      canEdit={canEdit}
    />
  );
}
