import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { deductInventory } from "@/lib/financial-engine";

// ─── POST: አዲስ ሽያጭ መፍጠር (Multi-item POS) ───
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    // body = { customerName, customerId, paymentMethod, discount, paidAmount, items: [{ itemId, quantity }] }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // 1) Inventory መጫን
    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();

    // 2) እያንዳንዱን item አረጋግጥ + ዋጋ አሰባስብ
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

    for (const cartItem of body.items) {
      const invRow = invRows.find((r) => String(r.get("Item_ID")) === String(cartItem.itemId));
      if (!invRow) {
        return NextResponse.json({ error: `Item ${cartItem.itemId} not found` }, { status: 404 });
      }

      const currentStock = Number(invRow.get("Stock_Quantity") ?? 0);
      const qty = Number(cartItem.quantity);

      // ⚠️ PROTECTED: deductInventory throws if insufficient
      let newStock: number;
      try {
        newStock = deductInventory(currentStock, qty);
      } catch (e: any) {
        return NextResponse.json(
          { error: `Insufficient stock for ${invRow.get("Item_Name")}: ${e.message}` },
          { status: 400 }
        );
      }

      const sellingPrice = Number(invRow.get("Selling_Price") ?? 0);
      const costPerItem = Number(invRow.get("Avg_Cost") ?? invRow.get("Cost_Price") ?? 0);

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

    // 3) Totals ስሌት (same as engine — ለማረጋገጫ)
    const subtotal = lines.reduce((s, l) => s + l.totalPrice, 0);
    const discount = Number(body.discount ?? 0);
    const totalAmount = Math.round((subtotal - discount) * 100) / 100;
    const paidAmount = Number(body.paidAmount ?? totalAmount);
    const paymentStatus = paidAmount >= totalAmount ? "Paid" : paidAmount > 0 ? "Partial" : "Unpaid";

    // 4) Sales_TBL ላይ ዋና ሽያጭ መዝግብ
    const salesSheet = await getSheet(SHEETS.SALES);
    const salesRows = await salesSheet.getRows();
    const salesId = `SAL-${String(salesRows.length + 1).padStart(4, "0")}`;
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(salesRows.length + 1).padStart(4, "0")}`;

    await salesSheet.addRow({
      Sales_ID: salesId,
      Date: new Date().toISOString(),
      Customer_Name: body.customerName || "Walk-in",
      Receipt_File: "",
      Recorded_By: session.user?.name ?? session.user?.email ?? "",
      Total_Amount: totalAmount,
      Sale_Status: "Completed",
      Invoice_No: invoiceNo,
      Customer_ID: body.customerId || "",
      Payment_Method: body.paymentMethod || "Cash",
      Discount: discount,
      Paid_Amount: paidAmount,
      Payment_Status: paymentStatus,
    });

    // 5) Sales_Items_TBL ላይ ዝርዝሮች
    const itemsSheet = await getSheet(SHEETS.SALES_ITEMS);
    const itemRows = await itemsSheet.getRows();
    let itemCounter = itemRows.length;

    for (const line of lines) {
      itemCounter++;
      await itemsSheet.addRow({
        Sales_Item_ID: `SLI-${String(itemCounter).padStart(4, "0")}`,
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

    // 6) Inventory ክምችት ቀንስ
    for (const line of lines) {
      const currentStock = Number(line.invRow.get("Stock_Quantity") ?? 0);
      const newStock = deductInventory(currentStock, line.quantity);
      line.invRow.set("Stock_Quantity", newStock);
      await line.invRow.save();
    }

    return NextResponse.json({
      ok: true,
      salesId,
      invoiceNo,
      totalAmount,
      paidAmount,
      paymentStatus,
    });
  } catch (e: any) {
    console.error("Sale error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── GET: ሽያጮችን አምጣ ───
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? 0);

    const salesSheet = await getSheet(SHEETS.SALES);
    const salesRows = await salesSheet.getRows();
    const sales = salesRows.map((r) => r.toObject());

    const itemsSheet = await getSheet(SHEETS.SALES_ITEMS);
    const itemRows = await itemsSheet.getRows();
    const items = itemRows.map((r) => r.toObject());

    // Group items by Sales_ID
    const itemsBySale: Record<string, any[]> = {};
    for (const it of items) {
      if (!itemsBySale[it.Sales_ID]) itemsBySale[it.Sales_ID] = [];
      itemsBySale[it.Sales_ID].push(it);
    }

    const enriched = sales.map((s: any) => ({
      ...s,
      Items: itemsBySale[s.Sales_ID] ?? [],
    }));

    const sorted = enriched.sort(
      (a: any, b: any) => new Date(b.Date).getTime() - new Date(a.Date).getTime()
    );

    return NextResponse.json(limit > 0 ? sorted.slice(0, limit) : sorted);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
