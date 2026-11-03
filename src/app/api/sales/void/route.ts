// src/app/api/sales/void/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { calculateAllStock } from "@/lib/inventory-stock";

export const revalidate = 0;
export const dynamic = "force-dynamic";

/**
 * POST /api/sales/void
 *
 * Body: {
 *   salesId: string;
 *   action: "void" | "refund" | "delete";
 *   reason: string;
 * }
 *
 * Only owner can void/refund/delete sales.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  if (role !== "owner") {
    return NextResponse.json(
      { error: "Only owner can void/refund/delete sales" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { salesId, action, reason } = body;

    if (!salesId) {
      return NextResponse.json({ error: "salesId required" }, { status: 400 });
    }
    if (!["void", "refund", "delete"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
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
    if (saleStatus === "Voided" || saleStatus === "Refunded") {
      return NextResponse.json(
        { error: `Sale is already ${saleStatus}` },
        { status: 400 }
      );
    }

    const invoiceNo = String(saleRow.get("Invoice_No") || "");
    const customerName = String(saleRow.get("Customer_Name") || "");
    const totalAmount = Number(saleRow.get("Total_Amount") || 0);
    const paidAmount = Number(saleRow.get("Paid_Amount") || 0);

    // ─── Load sale items ───
    const itemSheet = await getSheet(SHEETS.SALES_ITEMS);
    const itemRows = await itemSheet.getRows();
    const items = itemRows.filter(
      (r) => String(r.get("Sales_ID")) === String(salesId)
    );

    // ═══════════════════════════════════════════════════════════════
    // RESTORE STOCK (only if Completed sale)
    // ═══════════════════════════════════════════════════════════════
    let restoredCount = 0;

    if (saleStatus === "Completed" && items.length > 0) {
      const invSheet = await getSheet(SHEETS.INVENTORY);
      const invRows = await invSheet.getRows();

      for (const it of items) {
        const itemId = String(it.get("Item_ID") || "");
        const qty = Number(it.get("Quantity") || 0);
        if (!itemId || qty <= 0) continue;

        const invRow = invRows.find((r) => String(r.get("Item_ID")) === itemId);
        if (invRow) {
          // ✅ Restore Stock_Quantity directly (so AppSheet also sees it)
          const currentStock = Number(invRow.get("Stock_Quantity") || 0);
          invRow.set("Stock_Quantity", currentStock + qty);
          await invRow.save();
          restoredCount++;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // HANDLE ACTION
    // ═══════════════════════════════════════════════════════════════
    if (action === "delete") {
      // ─── DELETE: remove items + sale ───
      for (const it of items) {
        await it.delete();
      }
      await saleRow.delete();
    } else {
      // ─── VOID / REFUND: change status ───
      const newStatus = action === "void" ? "Voided" : "Refunded";
      saleRow.set("Sale_Status", newStatus);
      await saleRow.save();
    }

    // ═══════════════════════════════════════════════════════════════
    // LOG ACTIVITY
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
      await logSheet.addRow({
        Log_ID: `SACT-${String(logRows.length + 1).padStart(5, "0")}`,
        Date: new Date().toISOString(),
        Action: action,
        Sales_ID: salesId,
        Invoice_No: invoiceNo,
        Customer_Name: customerName,
        Performed_By: session.user?.name ?? session.user?.email ?? "",
        Role: role,
        Details: `Reason: ${reason || "Not specified"} · Restored ${restoredCount} items`,
        Old_Value: `Status: ${saleStatus}, Amount: ${totalAmount} ETB`,
        New_Value: `Status: ${action === "delete" ? "DELETED" : action === "void" ? "Voided" : "Refunded"}`,
      });
    } catch (e) {
      console.warn("Activity log failed:", e);
    }

    return NextResponse.json({
      ok: true,
      action,
      salesId,
      restoredItems: restoredCount,
      restoredStock: saleStatus === "Completed",
      newStatus: action === "delete" ? "DELETED" : action === "void" ? "Voided" : "Refunded",
    });
  } catch (e: any) {
    console.error("Void/refund error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
