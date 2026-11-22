// src/app/api/public/digital-orders/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSheet } from "@/lib/google-sheets";

const ORDERS_SHEET = "Digital_Orders_TBL";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sheet = await getSheet(ORDERS_SHEET);
    const rows = await sheet.getRows();
    const row = rows.find(
      (r) => String(r.get("Order_ID")).toUpperCase() === String(id).toUpperCase()
    );

    if (!row) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const status = String(row.get("Status") || "pending").toLowerCase();
    const downloadToken = String(row.get("Download_Token") || "");
    const telegramConnected = Boolean(row.get("Customer_Chat_ID"));

    return NextResponse.json({
      orderId: String(row.get("Order_ID")),
      status,
      telegramConnected,
      downloadUrl:
        status === "approved" && downloadToken
          ? `/api/download/${downloadToken}`
          : null,
      notes: status === "rejected" ? String(row.get("Notes") || "") : "",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
