// src/app/api/inventory/detail/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";

export const revalidate = 0;

/**
 * GET /api/inventory/detail?itemId=ITM-0001
 *
 * Returns full detail with role-based filtering:
 * - Owner/Manager: full data
 * - Employee/Staff: no cost, no profit
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "staff").toLowerCase();
  const isOwnerOrManager = ["owner", "manager"].includes(role);

  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId") || "";
    if (!itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }

    // ─── Load item ───
    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();
    const invRow = invRows.find((r) => String(r.get("Item_ID")) === String(itemId));
    if (!invRow) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const invObj = invRow.toObject() as any;
    const item = {
      id: String(invObj.Item_ID || ""),
      name: String(invObj.Item_Name || ""),
      code: String(invObj.Item_Code || ""),
      category: String(invObj.Category || invObj.Unit_Type || "General"),
      image: String(invObj.Item_Image || ""),
      stock: Number(invObj.Stock_Quantity || 0),
      costPrice: Number(invObj.Cost_Price || 0),
      sellingPrice: Number(invObj.Selling_Price || 0),
      avgCost: Number(invObj.Avg_Cost || invObj.Cost_Price || 0),
      unitType: String(invObj.Unit_Type || "pcs"),
      reorderLevel: Number(invObj.Reorder_Level || 10),
      status: String(invObj.Status || "Active"),
      supplierId: String(invObj.Supplier_ID || ""),
      date: String(invObj.Date || ""),
    };

    // ─── Supplier name ───
    let supplierName = "";
    try {
      const supSheet = await getSheet("Supplier_TBL");
      const supRows = await supSheet.getRows();
      const sup = supRows.find((r) => String(r.get("Supplier_ID")) === item.supplierId);
      supplierName = String(sup?.get("Supplier_Name") || "");
    } catch {
      /* ignore */
    }

    // ─── Stock-In history ───
    let stockInLogs: any[] = [];
    let totalPurchased = 0;
    let lastPurchased = "";
    try {
      const stockSheet = await getSheet(SHEETS.STOCK_IN);
      const stockRows = await stockSheet.getRows();
      stockInLogs = stockRows
        .map((r) => {
          const obj = r.toObject() as any;
          return {
            id: String(obj.Stock_In_ID || ""),
            itemId: String(obj.Item_ID || ""),
            date: String(obj.Date || ""),
            quantity: Number(obj.Quantity_In || 0),
            buyingPrice: Number(obj.Buying_Price || 0),
            recordedBy: String(obj.Recorded_By || ""),
            note: String(obj.Note || ""),
            totalPrice: Number(obj.Total_Price || 0),
          };
        })
        .filter((l) => l.itemId === itemId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      totalPurchased = stockInLogs.reduce((s, l) => s + l.quantity, 0);
      lastPurchased = stockInLogs[0]?.date || "";
    } catch {
      /* ignore */
    }

    // ─── Sales history ───
    let salesLogs: any[] = [];
    let totalSold = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let lastSold = "";

    try {
      const itemSheet = await getSheet(SHEETS.SALES_ITEMS);
      const salesSheet = await getSheet(SHEETS.SALES);
      const itemRows = await itemSheet.getRows();
      const salesRows = await salesSheet.getRows();

      const salesById: Record<string, any> = {};
      for (const s of salesRows) {
        const obj = s.toObject() as any;
        salesById[String(obj.Sales_ID)] = {
          date: String(obj.Date || ""),
          customer: String(obj.Customer_Name || "Walk-in"),
          invoiceNo: String(obj.Invoice_No || ""),
        };
      }

      salesLogs = itemRows
        .map((r) => {
          const obj = r.toObject() as any;
          return {
            salesItemId: String(obj.Sales_Item_ID || ""),
            salesId: String(obj.Sales_ID || ""),
            itemId: String(obj.Item_ID || ""),
            itemName: String(obj.Item_Name || ""),
            sellingPrice: Number(obj.Selling_Price || 0),
            quantity: Number(obj.Quantity || 0),
            totalPrice: Number(obj.Total_Price || 0),
            costPerItem: Number(obj.Cost_Per_Item || 0),
            totalCost: Number(obj.Total_Cost_Amount || 0),
          };
        })
        .filter((l) => l.itemId === itemId);

      totalSold = salesLogs.reduce((s, l) => s + l.quantity, 0);
      totalRevenue = salesLogs.reduce((s, l) => s + l.totalPrice, 0);
      totalCost = salesLogs.reduce((s, l) => s + l.totalCost, 0);

      salesLogs = salesLogs
        .map((l) => ({
          ...l,
          saleDate: salesById[l.salesId]?.date || "",
          customer: salesById[l.salesId]?.customer || "Walk-in",
          invoiceNo: salesById[l.salesId]?.invoiceNo || "",
        }))
        .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
      lastSold = salesLogs[0]?.saleDate || "";
    } catch {
      /* ignore */
    }

    const totalProfit = Math.round((totalRevenue - totalCost) * 100) / 100;
    const profitMargin =
      totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0;

    // ═══════════════════════════════════════════════════════════
    // Role-based filtering — do NOT send sensitive data to staff
    // ═══════════════════════════════════════════════════════════
    const responseData: any = {
      item: isOwnerOrManager
        ? { ...item, supplierName }
        : {
            id: item.id,
            name: item.name,
            code: item.code,
            category: item.category,
            image: item.image,
            stock: item.stock,
            sellingPrice: item.sellingPrice,
            unitType: item.unitType,
            reorderLevel: item.reorderLevel,
            status: item.status,
          },
      stats: {
        totalPurchased: isOwnerOrManager ? totalPurchased : null,
        totalSold,
        totalRevenue: isOwnerOrManager ? round2(totalRevenue) : null,
        totalCost: isOwnerOrManager ? round2(totalCost) : null,
        totalProfit: isOwnerOrManager ? totalProfit : null,
        profitMargin: isOwnerOrManager ? profitMargin : null,
        lastPurchased: isOwnerOrManager ? lastPurchased : null,
        lastSold,
      },
      stockInLogs: isOwnerOrManager ? stockInLogs.slice(0, 20) : [],
      salesLogs: isOwnerOrManager ? salesLogs.slice(0, 20) : salesLogs.slice(0, 5),
    };

    return NextResponse.json(responseData);
  } catch (e: any) {
    console.error("Detail error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
