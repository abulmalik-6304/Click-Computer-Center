// src/app/api/inventory/refresh/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ─── GET: Fresh inventory data (no cache) ───
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sheet = await getSheet(SHEETS.INVENTORY);
    const rows = await sheet.getRows();
    const items = rows
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

    return NextResponse.json({
      items,
      ts: Date.now(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
