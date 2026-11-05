// src/app/api/suppliers/detail/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCachedRows } from "@/lib/sheets-cache";
import { SHEETS } from "@/lib/google-sheets";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get("id") || "";
    const supplierName = searchParams.get("name") || "";

    if (!supplierId && !supplierName) {
      return NextResponse.json({ error: "id or name required" }, { status: 400 });
    }

    // ─── Load supplier ───
    const supplierData = await getCachedRows("Supplier_TBL");
    const supplierRow = supplierData.find((obj) => {
      if (supplierId && String(obj.Supplier_ID) === supplierId) return true;
      if (supplierName && String(obj.Supplier_Name || "").toLowerCase() === supplierName.toLowerCase())
        return true;
      return false;
    });

    if (!supplierRow) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const supplier = {
      id: String(supplierRow.Supplier_ID || ""),
      name: String(supplierRow.Supplier_Name || ""),
      phone: String(supplierRow.Phone_Number || ""),
      company: String(supplierRow.Company_Name || ""),
      supplyItem: String(supplierRow.Supply_Item || ""),
      address: String(supplierRow.Address || ""),
    };

    // ─── Load purchases (Stock_In_TBL) ───
    const [stockInData, inventoryData] = await Promise.all([
      getCachedRows(SHEETS.STOCK_IN),
      getCachedRows(SHEETS.INVENTORY),
    ]);

    // Find items from this supplier
    const supplierItems = inventoryData.filter(
      (i: any) => String(i.Supplier_ID || "") === supplier.id
    );
    const supplierItemIds = new Set(supplierItems.map((i: any) => String(i.Item_ID)));

    const purchases = stockInData
      .filter((p: any) => supplierItemIds.has(String(p.Item_ID || "")))
      .map((p: any) => ({
        stockInId: String(p.Stock_In_ID || ""),
        date: String(p.Date || ""),
        itemId: String(p.Item_ID || ""),
        quantity: Number(p.Quantity_In || 0),
        buyingPrice: Number(p.Buying_Price || 0),
        totalPrice: Number(p.Total_Price || Number(p.Quantity_In || 0) * Number(p.Buying_Price || 0)),
        recordedBy: String(p.Recorded_By || ""),
        note: String(p.Note || ""),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // ─── Items they supply ───
    const items = supplierItems.map((i: any) => ({
      id: String(i.Item_ID || ""),
      name: String(i.Item_Name || ""),
      code: String(i.Item_Code || ""),
      costPrice: Number(i.Cost_Price || 0),
      sellingPrice: Number(i.Selling_Price || 0),
    }));

    // ─── Stats ───
    const totalPurchaseValue = purchases.reduce((s, p) => s + p.totalPrice, 0);
    const totalQuantity = purchases.reduce((s, p) => s + p.quantity, 0);
    const lastPurchase = purchases[0]?.date || "";

    return NextResponse.json({
      supplier,
      stats: {
        totalPurchaseValue: round2(totalPurchaseValue),
        totalQuantity,
        totalPurchases: purchases.length,
        itemsSupplied: items.length,
        lastPurchase,
      },
      items,
      purchases,
    });
  } catch (e: any) {
    console.error("Supplier detail error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
