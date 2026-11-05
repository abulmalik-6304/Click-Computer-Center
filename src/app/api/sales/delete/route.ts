// src/app/api/sales/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { refreshCache } from "@/lib/sheets-cache";

export const revalidate = 0;
export const dynamic = "force-dynamic";

/**
 * DELETE /api/sales/delete
 * Body: { salesId, reason }
 *
 * Owner only.
 * 1. Restores stock (Stock_Quantity += qty)
 * 2. Deletes sale row + all its items
 * 3. Revenue automatically excluded (sale row gone)
 * 4. Logs to Sales_Activity_TBL
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  if (role !== "owner") {
    return NextResponse.json(
      { error: "Only owner can permanently delete sales" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { salesId, reason } = body;

    if (!salesId) {
      return NextResponse.json({ error: "salesId required" }, { status: 400 });
    }

    // ─── Load sale ───
    const salesSheet = await getSheet(SHEETS.SALES);
    const salesRows = await salesSheet.getRows();
    const saleRow = salesRows.find(
      (r) => String(r.get("Sales_ID")) === String(salesId)
    );
    if (!saleRow) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const saleStatus = String(saleRow.get("Sale_Status") || "Completed");
    const invoiceNo = String(saleRow.get("Invoice_No") || "");
    const customerName = String(saleRow.get("Customer_Name") || "");
    const totalAmount = Number(saleRow.get("Total_Amount") || 0);
    const paidAmount = Number(saleRow.get("Paid_Amount") || 0);

    // ─── Load items ───
    const itemsSheet = await getSheet(SHEETS.SALES_ITEMS);
    const itemRows = await itemsSheet.getRows();
    const items = itemRows.filter(
      (r) => String(r.get("Sales_ID")) === String(salesId)
    );

    // ═══════════════════════════════════════════════════════════════
    // 1️⃣ RESTORE STOCK (only if Completed — Voided/Refunded already restored)
    // ═══════════════════════════════════════════════════════════════
    let restoredCount = 0;
    const restoredItems: { name: string; qty: number }[] = [];

    if (saleStatus === "Completed" && items.length > 0) {
      const invSheet = await getSheet(SHEETS.INVENTORY);
      const invRows = await invSheet.getRows();

      for (const it of items) {
        const itemId = String(it.get("Item_ID") || "");
        const itemName = String(it.get("Item_Name") || "");
        const qty = Number(it.get("Quantity") || 0);
        if (!itemId || qty <= 0) continue;

        const invRow = invRows.find((r) => String(r.get("Item_ID")) === itemId);
        if (invRow) {
          const currentStock = Number(invRow.get("Stock_Quantity") || 0);
          invRow.set("Stock_Quantity", currentStock + qty);
          await invRow.save();
          restoredCount++;
          restoredItems.push({ name: itemName, qty });
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 2️⃣ DELETE ITEMS + SALE
    // ═══════════════════════════════════════════════════════════════
    for (const it of items) {
      await it.delete();
    }
    await saleRow.delete();

    // ═══════════════════════════════════════════════════════════════
    // 3️⃣ LOG ACTIVITY
    // ═══════════════════════════════════════════════════════════════
    try {
      const logSheet = await getSheet("Sales_Activity_TBL").catch(async () => {
        const { getDoc } = await import("@/lib/google-sheets");
        const doc = await getDoc();
        return await doc.addSheet({
          title: "Sales_Activity_TBL",
          headerValues: [
            "Log_ID",
            "Date",
            "Action",
            "Sales_ID",
            "Invoice_No",
            "Customer_Name",
            "Performed_By",
            "Role",
            "Details",
            "Old_Value",
            "New_Value",
          ],
        });
      });
      const logRows = await logSheet.getRows();

      const restoredText =
        restoredItems.length > 0
          ? `Restored: ${restoredItems.map((r) => `${r.name}×${r.qty}`).join(", ")}`
          : "No stock to restore";

      await logSheet.addRow({
        Log_ID: `SACT-${String(logRows.length + 1).padStart(5, "0")}`,
        Date: new Date().toISOString(),
        Action: "delete",
        Sales_ID: salesId,
        Invoice_No: invoiceNo,
        Customer_Name: customerName,
        Performed_By: session.user?.name ?? session.user?.email ?? "",
        Role: role,
        Details: `Reason: ${reason || "Not specified"} · ${restoredText} · Deleted ${items.length} items`,
        Old_Value: `Status: ${saleStatus}, Amount: ${totalAmount} ETB`,
        New_Value: `Status: DELETED, Revenue: -${totalAmount} ETB`,
      });
    } catch (e) {
      console.warn("Activity log failed:", e);
    }

    // ═══════════════════════════════════════════════════════════════
    // 4️⃣ INVALIDATE CACHES
    // ═══════════════════════════════════════════════════════════════
    await refreshCache(SHEETS.SALES);
    await refreshCache(SHEETS.SALES_ITEMS);
    await refreshCache(SHEETS.INVENTORY);

    return NextResponse.json({
      ok: true,
      salesId,
      deletedItems: items.length,
      restoredItems: restoredCount,
      revenueRemoved: totalAmount,
      paidAmountRemoved: paidAmount,
    });
  } catch (e: any) {
    console.error("Delete sale error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
