// src/app/api/sales/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { calculateAllStock } from "@/lib/inventory-stock";
import { refreshCache } from "@/lib/sheets-cache";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      customerName,
      customerId,
      customerPhone,
      paymentMethod,
      discount,
      paidAmount,
      saleStatus,
      items,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    const stockMap = await calculateAllStock();
    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();

    type Line = {
      itemId: string;
      itemName: string;
      sellingPrice: number;
      quantity: number;
      totalPrice: number;
      costPerItem: number;
      totalCost: number;
      invRow: any;
    };
    const lines: Line[] = [];

    for (const cartItem of items) {
      const invRow = invRows.find(
        (r) => String(r.get("Item_ID")) === String(cartItem.itemId)
      );
      if (!invRow) {
        return NextResponse.json(
          { error: `Item ${cartItem.itemId} not found` },
          { status: 404 }
        );
      }

      const calc = stockMap[cartItem.itemId];
      const currentStock = calc?.currentStock ?? 0;
      const qty = Number(cartItem.quantity);

      // ═══════════════════════════════════════════════════════════════
      // ✅ FROZEN COSTS — capture at sale time (Avg_Cost is dynamic)
      // ═══════════════════════════════════════════════════════════════
      const costPerItem = Number(
        invRow.get("Avg_Cost") ?? invRow.get("Cost_Price") ?? 0
      );
      const sellingPrice = Number(
        cartItem.sellingPrice ?? invRow.get("Selling_Price") ?? 0
      );

      // Price floor: cost + 10%
      const floorPrice = costPerItem * 1.1;
      if (sellingPrice < floorPrice) {
        return NextResponse.json(
          {
            error: `Selling price for ${invRow.get("Item_Name")} too low. Min: ${floorPrice.toFixed(2)} ETB`,
          },
          { status: 400 }
        );
      }

      if (saleStatus === "Completed" && currentStock < qty) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${invRow.get("Item_Name")}: have ${currentStock}, need ${qty}`,
          },
          { status: 400 }
        );
      }

      // ✅ FROZEN VALUES — written permanently to Sales_Items_TBL
      const lineTotalPrice = Math.round(sellingPrice * qty * 100) / 100;
      const lineTotalCost = Math.round(costPerItem * qty * 100) / 100;

      lines.push({
        itemId: invRow.get("Item_ID"),
        itemName: invRow.get("Item_Name"),
        sellingPrice,
        quantity: qty,
        totalPrice: lineTotalPrice,
        costPerItem,  // ✅ FROZEN — current Avg_Cost at sale time
        totalCost: lineTotalCost,  // ✅ FROZEN — costPerItem × qty
        invRow,
      });
    }

    const subtotal = lines.reduce((s, l) => s + l.totalPrice, 0);
    const discountAmt = Number(discount ?? 0);
    const totalAmount = Math.round((subtotal - discountAmt) * 100) / 100;
    const paidAmountNum = Number(paidAmount ?? totalAmount);
    const paymentStatus =
      paidAmountNum >= totalAmount ? "Paid" : paidAmountNum > 0 ? "Partial" : "Unpaid";

    const salesSheet = await getSheet(SHEETS.SALES);
    const salesRows = await salesSheet.getRows();
    const nextNum = salesRows.length + 1;
    const salesId = `SAL-${String(nextNum).padStart(5, "0")}`;
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(nextNum).padStart(4, "0")}`;

    await salesSheet.addRow({
      Sales_ID: salesId,
      Date: new Date().toISOString(),
      Customer_Name: customerName || "Walk-in",
      Receipt_File: "",
      Recorded_By: session.user?.name ?? session.user?.email ?? "",
      Total_Amount: totalAmount,
      Sale_Status: saleStatus || "Completed",
      Invoice_No: invoiceNo,
      Customer_ID: customerId || "",
      Payment_Method: paymentMethod || "Cash",
      Discount: discountAmt,
      Paid_Amount: paidAmountNum,
      Payment_Status: paymentStatus,
      Phone_Number: body.customerPhone || "",
    });

    // ═══════════════════════════════════════════════════════════════
    // ✅ SALES_ITEMS — Frozen cost saved permanently
    // ═══════════════════════════════════════════════════════════════
    const itemsSheet = await getSheet(SHEETS.SALES_ITEMS);
    const itemRows = await itemsSheet.getRows();
    let itemCounter = itemRows.length;

    for (const line of lines) {
      itemCounter++;
      await itemsSheet.addRow({
        Sales_Item_ID: `SLI-${String(itemCounter).padStart(5, "0")}`,
        Sales_ID: salesId,
        Item_ID: line.itemId,
        Item_Name: line.itemName,
        Selling_Price: line.sellingPrice,  // ✅ FROZEN
        Quantity: line.quantity,
        Total_Price: line.totalPrice,  // ✅ FROZEN
        Cost_Per_Item: line.costPerItem,  // ✅ FROZEN (cost at sale time)
        Total_Cost_Amount: line.totalCost,  // ✅ FROZEN
      });
    }

    // Invalidate caches
    await refreshCache(SHEETS.SALES);
    await refreshCache(SHEETS.SALES_ITEMS);

    return NextResponse.json({
      ok: true,
      salesId,
      invoiceNo,
      totalAmount,
      paidAmount: paidAmountNum,
      paymentStatus,
      saleStatus,
    });
  } catch (e: any) {
    console.error("Sale error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── GET: List sales ───
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const salesSheet = await getSheet(SHEETS.SALES);
    const salesRows = await salesSheet.getRows();
    const sales = salesRows.map((r) => r.toObject());

    const itemsSheet = await getSheet(SHEETS.SALES_ITEMS);
    const itemRows = await itemsSheet.getRows();
    const items = itemRows.map((r) => r.toObject());

    const itemsBySale: Record<string, any[]> = {};
    for (const it of items) {
      const sid = String(it.Sales_ID);
      if (!itemsBySale[sid]) itemsBySale[sid] = [];
      itemsBySale[sid].push(it);
    }

    const enriched = sales.map((s: any) => ({
      ...s,
      Items: itemsBySale[String(s.Sales_ID)] ?? [],
    }));

    enriched.sort(
      (a: any, b: any) =>
        new Date(b.Date).getTime() - new Date(a.Date).getTime()
    );

    return NextResponse.json(enriched);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
