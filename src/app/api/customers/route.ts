// src/app/api/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, getDoc, SHEETS } from "@/lib/google-sheets";
import { getCachedRows, refreshCache } from "@/lib/sheets-cache";

const SHEET = "Customer_TBL";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ─── GET: List all customers with stats ───
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [customerData, salesData] = await Promise.all([
      getCachedRows(SHEET),
      getCachedRows(SHEETS.SALES),
    ]);

    // Build sales stats by customer name
    const salesByName: Record<string, { amount: number; count: number; last: string }> = {};

    for (const sale of salesData) {
      const status = String(sale.Sale_Status || "").toLowerCase();
      if (status === "voided" || status === "refunded") continue;

      const name = String(sale.Customer_Name || "Walk-in").trim().toLowerCase();
      const amount = Number(sale.Total_Amount || 0);
      const date = String(sale.Date || "");

      if (!salesByName[name]) {
        salesByName[name] = { amount: 0, count: 0, last: "" };
      }
      salesByName[name].amount += amount;
      salesByName[name].count += 1;
      if (!salesByName[name].last || date > salesByName[name].last) {
        salesByName[name].last = date;
      }
    }

    const customers = customerData.map((obj, idx) => {
      const name = String(obj.Customer_Name || "");
      const stats = salesByName[name.trim().toLowerCase()];

      return {
        id: String(obj.Customer_ID || `CUS-${idx + 1}`),
        name,
        phone: String(obj.Phone_Number || ""),
        type: String(obj.Customer_Type || "Regular"),
        email: String(obj.Customer_Email || ""),
        address: String(obj.Address || ""),
        recordedBy: String(obj.Recorded_By || ""),
        totalPurchases: stats?.count ?? 0,
        totalAmount: stats?.amount ?? 0,
        lastPurchase: stats?.last ?? "",
        transactionCount: stats?.count ?? 0,
      };
    });

    return NextResponse.json({ customers });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({ customers: [] });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST: Create customer ───
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let sheet;
    try {
      sheet = await getSheet(SHEET);
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: SHEET,
        headerValues: [
          "Customer_ID",
          "Customer_Name",
          "Phone_Number",
          "Customer_Type",
          "Customer_Email",
          "Address",
          "Recorded_By",
        ],
      });
    }

    const rows = await sheet.getRows();
    const nextNum = rows.length + 1;
    const id = `CUS-${String(nextNum).padStart(4, "0")}`;

    await sheet.addRow({
      Customer_ID: id,
      Customer_Name: body.name,
      Phone_Number: body.phone || "",
      Customer_Type: body.type || "Regular",
      Customer_Email: body.email || "",
      Address: body.address || "",
      Recorded_By: session.user?.name ?? session.user?.email ?? "",
    });

    await refreshCache(SHEET);

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── PUT: Update customer ───
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Customer_ID")) === String(body.id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.name !== undefined) row.set("Customer_Name", body.name);
    if (body.phone !== undefined) row.set("Phone_Number", body.phone);
    if (body.type !== undefined) row.set("Customer_Type", body.type);
    if (body.email !== undefined) row.set("Customer_Email", body.email);
    if (body.address !== undefined) row.set("Address", body.address);
    await row.save();

    await refreshCache(SHEET);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── DELETE: Delete customer ───
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  if (!["owner", "manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Customer_ID")) === String(id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await row.delete();
    await refreshCache(SHEET);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
