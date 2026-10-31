// src/app/api/inventory/stock-in/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";

export const revalidate = 0;

// ─── POST: Stock-In (add quantity) ───
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  if (!["owner", "manager", "employee", "staff"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      itemId,
      quantity,
      buyingPrice,
      note,
      supplierId,
      paymentMonth,
    } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }

    // ─── Load Inventory ───
    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();
    const invRow = invRows.find(
      (r) => String(r.get("Item_ID")) === String(itemId)
    );
    if (!invRow) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const oldStock = Number(invRow.get("Stock_Quantity") ?? 0);
    const oldAvgCost = Number(invRow.get("Avg_Cost") ?? invRow.get("Cost_Price") ?? 0);
    const newBuyPrice = Number(buyingPrice ?? oldAvgCost) || oldAvgCost;

    // ═══════════════════════════════════════════════════════════
    // Weighted average cost — DO NOT change formula
    // ═══════════════════════════════════════════════════════════
    const totalOldValue = oldStock * oldAvgCost;
    const totalNewValue = qty * newBuyPrice;
    const newStock = oldStock + qty;
    const newAvgCost =
      newStock > 0
        ? Math.round(((totalOldValue + totalNewValue) / newStock) * 100) / 100
        : 0;

    // ─── Write Stock_In_TBL ───
    let stockSheet;
    try {
      stockSheet = await getSheet(SHEETS.STOCK_IN);
    } catch {
      const { getDoc } = await import("@/lib/google-sheets");
      const doc = await getDoc();
      stockSheet = await doc.addSheet({
        title: SHEETS.STOCK_IN,
        headerValues: [
          "Stock_In_ID",
          "Date",
          "Item_ID",
          "Quantity_In",
          "Buying_Price",
          "Recorded_By",
          "Note",
        ],
      });
    }
    const stockRows = await stockSheet.getRows();
    const stockId = `STK-${String(stockRows.length + 1).padStart(5, "0")}`;

    await stockSheet.addRow({
      Stock_In_ID: stockId,
      Date: new Date().toISOString().slice(0, 10),
      Item_ID: itemId,
      Quantity_In: qty,
      Buying_Price: newBuyPrice,
      Recorded_By: session.user?.name ?? session.user?.email ?? "",
      Note: note || supplierId || paymentMonth || "",
    });

    // ─── Update Inventory ───
    invRow.set("Stock_Quantity", newStock);
    invRow.set("Avg_Cost", newAvgCost);
    if (buyingPrice) invRow.set("Cost_Price", newBuyPrice);
    await invRow.save();

    return NextResponse.json({
      ok: true,
      stockId,
      newStock,
      newAvgCost,
      added: qty,
    });
  } catch (e: any) {
    console.error("Stock-in error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── GET: Stock-In history for an item ───
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId") || "";

    const sheet = await getSheet(SHEETS.STOCK_IN);
    const rows = await sheet.getRows();
    let logs = rows.map((r) => {
      const obj = r.toObject() as any;
      return {
        id: String(obj.Stock_In_ID || ""),
        date: String(obj.Date || ""),
        itemId: String(obj.Item_ID || ""),
        quantity: Number(obj.Quantity_In || 0),
        buyingPrice: Number(obj.Buying_Price || 0),
        recordedBy: String(obj.Recorded_By || ""),
        note: String(obj.Note || ""),
      };
    });

    if (itemId) {
      logs = logs.filter((l) => l.itemId === itemId);
    }
    logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ logs });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({ logs: [] });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
