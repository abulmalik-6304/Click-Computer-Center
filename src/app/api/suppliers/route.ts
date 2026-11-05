// src/app/api/suppliers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, getDoc } from "@/lib/google-sheets";
import { getCachedRows, refreshCache } from "@/lib/sheets-cache";

const SHEET = "Supplier_TBL";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ─── GET: List all suppliers ───
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await getCachedRows(SHEET);

    const suppliers = data.map((obj, idx) => ({
      id: String(obj.Supplier_ID || `SUP-${idx + 1}`),
      name: String(obj.Supplier_Name || ""),
      phone: String(obj.Phone_Number || ""),
      company: String(obj.Company_Name || ""),
      supplyItem: String(obj.Supply_Item || ""),
      address: String(obj.Address || ""),
    }));

    return NextResponse.json({ suppliers });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({ suppliers: [] });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST: Create supplier ───
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
          "Supplier_ID",
          "Supplier_Name",
          "Phone_Number",
          "Company_Name",
          "Supply_Item",
          "Address",
        ],
      });
    }

    const rows = await sheet.getRows();
    const nextNum = rows.length + 1;
    const id = `SUP-${String(nextNum).padStart(4, "0")}`;

    await sheet.addRow({
      Supplier_ID: id,
      Supplier_Name: body.name,
      Phone_Number: body.phone || "",
      Company_Name: body.company || "",
      Supply_Item: body.supplyItem || "",
      Address: body.address || "",
    });

    await refreshCache(SHEET);

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── PUT: Update supplier ───
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Supplier_ID")) === String(body.id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.name !== undefined) row.set("Supplier_Name", body.name);
    if (body.phone !== undefined) row.set("Phone_Number", body.phone);
    if (body.company !== undefined) row.set("Company_Name", body.company);
    if (body.supplyItem !== undefined) row.set("Supply_Item", body.supplyItem);
    if (body.address !== undefined) row.set("Address", body.address);
    await row.save();

    await refreshCache(SHEET);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── DELETE: Delete supplier ───
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
    const row = rows.find((r) => String(r.get("Supplier_ID")) === String(id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await row.delete();
    await refreshCache(SHEET);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
