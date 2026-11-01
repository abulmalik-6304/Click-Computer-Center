// src/app/api/sales/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { deductInventory } from "@/lib/financial-engine";

export const revalidate = 0;

// ─── POST: Create sale (Draft or Completed) ───
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
      saleStatus, // "Draft" | "Completed"
      items, // [{ itemId, quantity, sellingPrice, costPerItem }]
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // ─── Load Inventory ───
    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();

    // ─── Validate items + compute line totals ───
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

      const currentStock = Number(invRow.get("Stock_Quantity") ?? 0);
      const qty = Number(cartItem.quantity);
      const costPerItem = Number(
        invRow.get("Avg_Cost") ?? invRow.get("Cost_Price") ?? 0
      );
      const sellingPrice = Number(
        cartItem.sellingPrice ?? invRow.get("Selling_Price") ?? 0
      );

      // ⚠️ Profit floor: price cannot be below cost + 10%
      const floorPrice = costPerItem * 1.1;
      if (sellingPrice < floorPrice) {
        return NextResponse.json(
          {
            error: `Selling price for ${invRow.get("Item_Name")} is too low. Minimum: ${floorPrice.toFixed(2)} ETB (cost + 10%)`,
          },
          { status: 400 }
        );
      }

      // ⚠️ Stock check for Completed sales only
      if (saleStatus === "Completed" && currentStock < qty) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${invRow.get("Item_Name")}: have ${currentStock}, need ${qty}`,
          },
          { status: 400 }
        );
      }

      lines.push({
        itemId: invRow.get("Item_ID"),
        itemName: invRow.get("Item_Name"),
        sellingPrice,
        quantity: qty,
        totalPrice: Math.round(sellingPrice * qty * 100) / 100,
        costPerItem,
        totalCost: Math.round(costPerItem * qty * 100) / 100,
        invRow,
      });
    }

    // ─── Totals ───
    const subtotal = lines.reduce((s, l) => s + l.totalPrice, 0);
    const discountAmt = Number(discount ?? 0);
    const totalAmount = Math.round((subtotal - discountAmt) * 100) / 100;
    const paidAmountNum = Number(paidAmount ?? totalAmount);
    const paymentStatus =
      paidAmountNum >= totalAmount ? "Paid" : paidAmountNum > 0 ? "Partial" : "Unpaid";

    // ─── Sales_TBL ───
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

    // ─── Sales_Items_TBL ───
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
        Selling_Price: line.sellingPrice,
        Quantity: line.quantity,
        Total_Price: line.totalPrice,
        Cost_Per_Item: line.costPerItem,
        Total_Cost_Amount: line.totalCost,
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔧 STOCK DEDUCTION — Only for Completed sales
    // ═══════════════════════════════════════════════════════════════
    if (saleStatus === "Completed") {
      for (const line of lines) {
        const currentStock = Number(line.invRow.get("Stock_Quantity") ?? 0);
        const newStock = deductInventory(currentStock, line.quantity);
        line.invRow.set("Stock_Quantity", newStock);
        await line.invRow.save();
      }
    }

    return NextResponse.json({
      ok: true,
      salesId,
      invoiceNo,
      totalAmount,
      paidAmount: paidAmountNum,
      paymentStatus,
      saleStatus,
      stockDeducted: saleStatus === "Completed",
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
