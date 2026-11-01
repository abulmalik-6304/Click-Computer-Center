// src/app/api/sales/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";

export const revalidate = 0;

/**
 * DELETE /api/sales/delete
 * Body: { salesId, reason }
 *
 * Owner only — deletes sale + items + logs activity.
 * For Completed sales, stock is restored.
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  if (role !== "owner") {
    return NextResponse.json(
      { error: "Only owner can delete sales" },
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

    // ─── Load items ───
    const itemSheet = await getSheet(SHEETS.SALES_ITEMS);
    const itemRows = await itemSheet.getRows();
    const items = itemRows.filter(
      (r) => String(r.get("Sales_ID")) === String(salesId)
    );

    // ─── Restore stock (only for Completed) ───
    if (saleStatus === "Completed" && items.length > 0) {
      const invSheet = await getSheet(SHEETS.INVENTORY);
      const invRows = await invSheet.getRows();

      for (const it of items) {
        const itemId = String(it.get("Item_ID") || "");
        const qty = Number(it.get("Quantity") || 0);
        const invRow = invRows.find((r) => String(r.get("Item_ID")) === itemId);
        if (invRow) {
          const currentStock = Number(invRow.get("Stock_Quantity") || 0);
          invRow.set("Stock_Quantity", currentStock + qty);
          await invRow.save();
        }
      }
    }

    // ─── Delete items ───
    for (const it of items) {
      await it.delete();
    }

    // ─── Delete sale ───
    await saleRow.delete();

    // ─── Log activity ───
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
      await logSheet.addRow({
        Log_ID: `SACT-${String(logRows.length + 1).padStart(5, "0")}`,
        Date: new Date().toISOString(),
        Action: "delete",
        Sales_ID: salesId,
        Invoice_No: invoiceNo,
        Customer_Name: customerName,
        Performed_By: session.user?.name ?? session.user?.email ?? "",
        Role: role,
        Details: reason ? `Reason: ${reason}` : "Deleted",
        Old_Value: `Status: ${saleStatus}, Items: ${items.length}`,
        New_Value: "Deleted",
      });
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      ok: true,
      restoredStock: saleStatus === "Completed",
      itemsDeleted: items.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
