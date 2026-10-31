// src/app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";

export const revalidate = 0;

// ─── GET: List expenses ───
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const category = searchParams.get("category") || "all";
    const q = (searchParams.get("q") || "").toLowerCase().trim();

    const sheet = await getSheet(SHEETS.EXPENSES);
    const rows = await sheet.getRows();

    let expenses = rows.map((r) => {
      const obj = r.toObject() as any;
      return {
        id: String(obj.Expense_ID || ""),
        date: String(obj.Date || ""),
        category: String(obj.Category || ""),
        amount: Number(obj.Amount || 0),
        description: String(obj.Description || obj.Description || ""),
        recordedBy: String(obj.Recorded_By || ""),
        employeeName: String(obj.Employee_Name || ""),
        jobRole: String(obj.Job_Role || ""),
        paymentMonth: String(obj.Payment_Month || ""),
      };
    });

    // Filters
    if (from) {
      const fd = new Date(from);
      expenses = expenses.filter((e) => new Date(e.date) >= fd);
    }
    if (to) {
      const td = new Date(to);
      td.setHours(23, 59, 59, 999);
      expenses = expenses.filter((e) => new Date(e.date) <= td);
    }
    if (category !== "all") {
      expenses = expenses.filter(
        (e) => e.category.toLowerCase() === category.toLowerCase()
      );
    }
    if (q) {
      expenses = expenses.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.recordedBy.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    expenses.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Totals
    const total = expenses.reduce((s, e) => s + e.amount, 0);

    return NextResponse.json({
      expenses,
      total: Math.round(total * 100) / 100,
      count: expenses.length,
    });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({ expenses: [], total: 0, count: 0 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST: Create expense ───
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    if (!body.category || !body.amount) {
      return NextResponse.json(
        { error: "Category and amount are required" },
        { status: 400 }
      );
    }

    const sheet = await getSheet(SHEETS.EXPENSES);
    const rows = await sheet.getRows();
    const nextNum = rows.length + 1;
    const id = `EXP-${String(nextNum).padStart(4, "0")}`;

    await sheet.addRow({
      Expense_ID: id,
      Date: body.date || new Date().toISOString().slice(0, 10),
      Category: body.category,
      Amount: Number(body.amount),
      Description: body.description || "",
      Recorded_By: session.user?.name ?? session.user?.email ?? "",
      Employee_Name: body.employeeName || "",
      Job_Role: body.jobRole || "",
      Payment_Month: body.paymentMonth || "",
    });

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── DELETE: Delete expense ───
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

    const sheet = await getSheet(SHEETS.EXPENSES);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Expense_ID")) === String(id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await row.delete();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
