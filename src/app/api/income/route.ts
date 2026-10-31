// src/app/api/income/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { INCOME_SOURCES } from "@/lib/income-categories";

export const revalidate = 0;

const SHEET = "Income_TBL";

// ─── GET: List income ───
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const source = searchParams.get("source") || "all";
    const category = searchParams.get("category") || "all";
    const q = (searchParams.get("q") || "").toLowerCase().trim();

    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();

    let income = rows.map((r) => {
      const obj = r.toObject() as any;
      return {
        id: String(obj.Income_ID || ""),
        date: String(obj.Date || ""),
        incomeSource: String(obj.Income_Source || ""),
        price: Number(obj.Price || 0),
        quantity: Number(obj.Quantity || 1),
        totalPrice: Number(obj.Total_Price || 0),
        recordedBy: String(obj.Recorded_By || ""),
        incomeCategory: String(obj.Income_Category || ""),
        description: String(obj.Description || ""),
        grossIncome: Number(obj.Gross_Income || 0),
        usedMaterial: String(obj.Used_Material || ""),
        costPriceMain: Number(obj.Cost_Price_Maine || 0),
        packSize: Number(obj.Pack_Size || 0),
        usedQty: Number(obj.Used_Qty || 0),
        materialCost: Number(obj.Material_Cost || 0),
        netIncome: Number(obj.Net_Income || 0),
      };
    });

    // Filters
    if (from) {
      const fd = new Date(from);
      income = income.filter((i) => new Date(i.date) >= fd);
    }
    if (to) {
      const td = new Date(to);
      td.setHours(23, 59, 59, 999);
      income = income.filter((i) => new Date(i.date) <= td);
    }
    if (source !== "all") {
      income = income.filter(
        (i) => i.incomeSource.toLowerCase() === source.toLowerCase()
      );
    }
    if (category !== "all") {
      income = income.filter(
        (i) => i.incomeCategory.toLowerCase() === category.toLowerCase()
      );
    }
    if (q) {
      income = income.filter(
        (i) =>
          i.description.toLowerCase().includes(q) ||
          i.recordedBy.toLowerCase().includes(q) ||
          i.incomeCategory.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    income.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Totals
    const totalPrice = income.reduce((s, i) => s + i.totalPrice, 0);
    const totalCost = income.reduce((s, i) => s + i.materialCost, 0);
    const totalNet = income.reduce((s, i) => s + i.netIncome, 0);

    return NextResponse.json({
      income,
      totals: {
        totalPrice: round2(totalPrice),
        totalCost: round2(totalCost),
        totalNet: round2(totalNet),
      },
      count: income.length,
    });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({
        income: [],
        totals: { totalPrice: 0, totalCost: 0, totalNet: 0 },
        count: 0,
      });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST: Create income ───
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((session.user as any).role || "").toLowerCase();
  if (!["owner", "manager", "employee", "staff"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();

    // ─── Validation ───
    if (!body.incomeSource) {
      return NextResponse.json({ error: "Income source required" }, { status: 400 });
    }
    if (!body.incomeCategory) {
      return NextResponse.json({ error: "Income category required" }, { status: 400 });
    }
    if (!body.price || Number(body.price) <= 0) {
      return NextResponse.json({ error: "Price must be > 0" }, { status: 400 });
    }

    // ─── Validate source/category relationship ───
    const src = INCOME_SOURCES.find(
      (s) => s.value === String(body.incomeSource).toLowerCase()
    );
    if (!src) {
      return NextResponse.json({ error: "Invalid income source" }, { status: 400 });
    }
    const validCat = src.categories.find(
      (c) => c.value === String(body.incomeCategory).toLowerCase()
    );
    if (!validCat) {
      return NextResponse.json(
        { error: "Category does not belong to selected source" },
        { status: 400 }
      );
    }

    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();
    const nextNum = rows.length + 1;
    const id = `INC-${String(nextNum).padStart(4, "0")}`;

    // ─── Compute derived values ───
    const price = Number(body.price);
    const qty = Number(body.quantity) || 1;
    const totalPrice = round2(price * qty);

    const costPriceMain = Number(body.costPriceMain) || 0;
    const packSize = Number(body.packSize) || 0;
    const usedQty = Number(body.usedQty) || 0;

    // Material cost: (cost per pack / pack size) × used qty
    const materialCost =
      packSize > 0 && costPriceMain > 0
        ? round2((costPriceMain / packSize) * usedQty)
        : 0;

    const grossIncome = totalPrice;
    const netIncome = round2(grossIncome - materialCost);

    await sheet.addRow({
      Income_ID: id,
      Date: body.date || new Date().toISOString().slice(0, 10),
      Income_Source: src.label,
      Price: price,
      Quantity: qty,
      Total_Price: totalPrice,
      Recorded_By: session.user?.name ?? session.user?.email ?? "",
      All_Income_Total: "", // Can be filled by formula
      Income_Category: validCat.label,
      Description: body.description || "",
      Gross_Income: grossIncome,
      Used_Material: body.usedMaterial || "",
      "Cost_Price_ Maine": costPriceMain,
      Pack_Size: packSize,
      Used_Qty: usedQty,
      Material_Cost: materialCost,
      Net_Income: netIncome,
    });

    return NextResponse.json({ ok: true, id, netIncome, materialCost });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── DELETE: Delete income ───
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
    const row = rows.find((r) => String(r.get("Income_ID")) === String(id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await row.delete();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
