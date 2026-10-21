import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json(); // { itemId, quantity, buyingPrice, note }
    const qty = Number(body.quantity);
    if (!qty || qty <= 0) {
      return NextResponse.json({ error: "Quantity must be > 0" }, { status: 400 });
    }

    // 1) Stock_In_TBL ላይ መዝግብ
    const stockSheet = await getSheet(SHEETS.STOCK_IN);
    const stockRows = await stockSheet.getRows();
    const stockId = `STK-${String(stockRows.length + 1).padStart(4, "0")}`;
    await stockSheet.addRow({
      Stock_In_ID: stockId,
      Date: new Date().toISOString().slice(0, 10),
      Item_ID: body.itemId,
      Quantity_In: qty,
      Buying_Price: body.buyingPrice ?? 0,
      Recorded_By: session.user?.email ?? "",
      Note: body.note ?? "",
    });

    // 2) Inventory_TBL ላይ ክምችትና Avg_Cost አዘምን
    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();
    const invRow = invRows.find((r) => String(r.get("Item_ID")) === String(body.itemId));
    if (!invRow) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const oldStock = Number(invRow.get("Stock_Quantity") ?? 0);
    const oldAvg = Number(invRow.get("Avg_Cost") ?? invRow.get("Cost_Price") ?? 0);
    const newBuyPrice = Number(body.buyingPrice ?? oldAvg);

    // Weighted average cost (⚠️ PROTECTED FINANCIAL LOGIC)
    const totalOldValue = oldStock * oldAvg;
    const totalNewValue = qty * newBuyPrice;
    const newStock = oldStock + qty;
    const newAvg = newStock > 0 ? (totalOldValue + totalNewValue) / newStock : 0;

    invRow.set("Stock_Quantity", newStock);
    invRow.set("Avg_Cost", Math.round(newAvg * 100) / 100);
    await invRow.save();

    return NextResponse.json({
      ok: true,
      stockId,
      newStock,
      newAvgCost: Math.round(newAvg * 100) / 100,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
