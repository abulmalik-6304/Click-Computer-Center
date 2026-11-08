// src/app/api/inventory/refresh/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { calculateAllStock } from "@/lib/inventory-stock";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sheet = await getSheet(SHEETS.INVENTORY);
    const rows = await sheet.getRows();
    const stockMap = await calculateAllStock();

    const items = rows
      .map((r) => {
        const obj = r.toObject() as any;
        const itemId = String(obj.Item_ID || "");
        const calc = stockMap[itemId];
        const stock = calc?.currentStock ?? 0;

        // ✅ Extract prices once (used for costPrice, sellingPrice, avgCost)
        const costPrice = Number(obj.Cost_Price || 0);
        const sellingPrice = Number(obj.Selling_Price || 0);

        return {
          id: itemId,
          name: String(obj.Item_Name || ""),
          code: String(obj.Item_Code || ""),
          category: String(obj.Category || obj.Unit_Type || "General"),
          image: String(obj.Item_Image || ""),
          stock,
          costPrice, // ✅ From inventory
          sellingPrice,
          avgCost: costPrice,
          unitType: String(obj.Unit_Type || "pcs"),
          packSize: Number(obj.Pack_Size || obj.PackSize || 1) || 1, // ✅ አዲስ
          reorderLevel: Number(obj.Reorder_Level || 10),
          status: String(obj.Status || "Active"),
          supplierId: String(obj.Supplier_ID || ""),
          date: String(obj.Date || ""),
        };
      })
      .filter((i) => i.status !== "Archived");

    return NextResponse.json({
      items,
      ts: Date.now(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
