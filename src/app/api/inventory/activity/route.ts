// src/app/api/inventory/activity/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, getDoc } from "@/lib/google-sheets";
import { ACTIVITY_SHEET, ACTIVITY_HEADERS } from "@/lib/inventory-activity";

export const revalidate = 0;

// ─── POST: Log activity ───
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { action, itemId, itemName, details, oldValue, newValue } = body;

    if (!action || !itemId) {
      return NextResponse.json({ error: "action and itemId required" }, { status: 400 });
    }

    let sheet;
    try {
      sheet = await getSheet(ACTIVITY_SHEET);
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: ACTIVITY_SHEET,
        headerValues: ACTIVITY_HEADERS,
      });
    }

    const rows = await sheet.getRows();
    const nextNum = rows.length + 1;

    await sheet.addRow({
      Log_ID: `ACT-${String(nextNum).padStart(5, "0")}`,
      Date: new Date().toISOString(),
      Action: action,
      Item_ID: itemId,
      Item_Name: itemName || "",
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

// ─── GET: Activity log (owner only) ───
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  if (role !== "owner") {
    return NextResponse.json({ error: "Forbidden — owner only" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(500, Number(searchParams.get("limit") || 100));

    const sheet = await getSheet(ACTIVITY_SHEET);
    const rows = await sheet.getRows();
    const logs = rows
      .map((r) => {
        const obj = r.toObject() as any;
        return {
          id: String(obj.Log_ID || ""),
          date: String(obj.Date || ""),
          action: String(obj.Action || ""),
          itemId: String(obj.Item_ID || ""),
          itemName: String(obj.Item_Name || ""),
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
