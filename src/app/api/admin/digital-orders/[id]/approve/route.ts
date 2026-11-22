// src/app/api/admin/digital-orders/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet } from "@/lib/google-sheets";
import { normalizeRole } from "@/lib/roles";
import {
  notifyOrderApproved,
  notifyOrderRejected,
} from "@/lib/telegram";

const ORDERS_SHEET = "Digital_Orders_TBL";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ✅ POST: Approve or Reject order
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { action, notes } = body;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const sheet = await getSheet(ORDERS_SHEET);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Order_ID")) === String(id));
    if (!row) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    row.set("Status", newStatus);
    row.set(
      "Approved_By",
      session.user?.name ?? session.user?.email ?? ""
    );
    row.set("Approved_At", new Date().toISOString());
    if (notes) row.set("Notes", notes);

    await row.save();

    // ✅ POST: Approve or Reject order
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { action, notes } = body;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const sheet = await getSheet(ORDERS_SHEET);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Order_ID")) === String(id));
    if (!row) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    row.set("Status", newStatus);
    row.set(
      "Approved_By",
      session.user?.name ?? session.user?.email ?? ""
    );
    row.set("Approved_At", new Date().toISOString());
    if (notes) row.set("Notes", notes);

    await row.save();

    // ✅ Notify via Telegram
    const orderData = {
      id: String(row.get("Order_ID") || ""),
      productTitle: String(row.get("Product_Title") || ""),
      customerName: String(row.get("Customer_Name") || ""),
      customerPhone: String(row.get("Customer_Phone") || ""),
      downloadToken: String(row.get("Download_Token") || ""),
    };

    if (action === "approve") {
      notifyOrderApproved(orderData).catch((e) =>
        console.warn("Telegram approve notify failed:", e)
      );
    } else {
      notifyOrderRejected({ ...orderData, reason: notes }).catch((e) =>
        console.warn("Telegram reject notify failed:", e)
      );
    }

    return NextResponse.json({
      ok: true,
      status: newStatus,
      message: `Order ${newStatus}`,
    });
  } catch (e: any) {
    console.error("Order approve/reject error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

    return NextResponse.json({
      ok: true,
      status: newStatus,
      message: `Order ${newStatus}`,
    });
  } catch (e: any) {
    console.error("Order approve/reject error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
