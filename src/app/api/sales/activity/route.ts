// src/app/api/sales/activity/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, getDoc } from "@/lib/google-sheets";
import {
  SALES_ACTIVITY_SHEET,
  SALES_ACTIVITY_HEADERS,
} from "@/lib/sales-activity";

export const revalidate = 0;

// ─── POST: Log activity ───
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      action,
      salesId,
      invoiceNo,
      customerName,
      details,
      oldValue,
      newValue,
    } = body;

    if (!action || !salesId) {
      return NextResponse.json(
        { error: "action and salesId required" },
        { status: 400 }
      );
    }

    let sheet;
    try {
      sheet = await getSheet(SALES_ACTIVITY_SHEET);
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: SALES_ACTIVITY_SHEET,
        headerValues: SALES_ACTIVITY_HEADERS,
      });
    }

    const rows = await sheet.getRows();
    const nextNum = rows.length + 1;

    await sheet.addRow({
      Log_ID: `SACT-${String(nextNum).padStart(5, "0")}`,
      Date: new Date().toISOString(),
      Action: action,
      Sales_ID: salesId,
      Invoice_No: invoiceNo || "",
      Customer_Name: customerName || "",
      Performed_By: session.user?.name ?? session.user?.email ?? "",
      Role: String((session.user as any).role || ""),
      Details: details || "",
      Old_Value: oldValue || "",
      New_Value: newValue || "",
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── GET: Activity log ───
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  // Only owner and manager can see sales activity
  if (!["owner", "manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, Number(searchParams.get("limit") || 50));

    const sheet = await getSheet(SALES_ACTIVITY_SHEET);
    const rows = await sheet.getRows();
    const logs = rows
      .map((r) => {
        const obj = r.toObject() as any;
        return {
          id: String(obj.Log_ID || ""),
          date: String(obj.Date || ""),
          action: String(obj.Action || ""),
          salesId: String(obj.Sales_ID || ""),
          invoiceNo: String(obj.Invoice_No || ""),
          customerName: String(obj.Customer_Name || ""),
          performedBy: String(obj.Performed_By || ""),
          role: String(obj.Role || ""),
          details: String(obj.Details || ""),
          oldValue: String(obj.Old_Value || ""),
          newValue: String(obj.New_Value || ""),
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    return NextResponse.json({ logs });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({ logs: [] });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
