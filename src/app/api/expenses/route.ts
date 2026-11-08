// src/app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { hasPermission } from "@/lib/permissions";
import { normalizeRole } from "@/lib/roles";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ─── GET: List all expenses ───
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sheet = await getSheet("Expense_TBL");
    const rows = await sheet.getRows();
    const expenses = rows
      .map((r) => {
        const o = r.toObject() as any;
        return {
          id: String(o.Expense_ID || ""),
          date: String(o.Date || ""),
          category: String(o.Category || ""),
          amount: Number(o.Amount || 0),
          description: String(o.Description || ""),
          recordedBy: String(o.Recorded_By || ""),
          employeeName: String(o.Employee_Name || ""),
          jobRole: String(o.Job_Role || ""),
          paymentMonth: String(o.Payment_Month || ""),
          allowance: Number(o.Allowance || 0), // 🆕
          salary: Number(o.Salary || 0), // 🆕
        };
      })
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

    return NextResponse.json({ expenses });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST: Create new expense ───
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = normalizeRole((session.user as any).role);
  const email = String(session.user?.email || "");
  const canAdd = await hasPermission(email, role, "canAddExpense");
  if (!canAdd) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const sheet = await getSheet("Expense_TBL");
    const rows = await sheet.getRows();

    // ✅ Generate Expense_ID
    const existingIds = rows
      .map((r) => String(r.get("Expense_ID") || ""))
      .filter((id) => id.startsWith("EXP-"));
    const maxNum = existingIds.reduce((max, id) => {
      const n = Number(id.replace("EXP-", ""));
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const newId = `EXP-${String(maxNum + 1).padStart(4, "0")}`;

    const newRow = {
      Expense_ID: newId,
      Date: body.date,
      Category: body.category,
      Amount: body.amount,
      Description: body.description || "",
      Recorded_By:
        session.user?.name || session.user?.email || email || "",
      Employee_Name: body.employeeName || "",
      Job_Role: body.jobRole || "",
      Payment_Month: body.paymentMonth || "",
      Allowance: Number(body.allowance) || 0, // 🆕
      Salary: Number(body.salary) || 0, // 🆕
    };

    await sheet.addRow(newRow);

    return NextResponse.json({
      ok: true,
      expense: {
        id: newId,
        date: body.date,
        category: body.category,
        amount: body.amount,
        description: body.description,
        recordedBy: newRow.Recorded_By,
        employeeName: body.employeeName,
        jobRole: body.jobRole,
        paymentMonth: body.paymentMonth,
        allowance: newRow.Allowance, // 🆕
        salary: newRow.Salary, // 🆕
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── PUT: Update existing expense ───
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = normalizeRole((session.user as any).role);
  const email = String(session.user?.email || "");
  const canEdit = await hasPermission(email, role, "canEditExpense");
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const sheet = await getSheet("Expense_TBL");
    const rows = await sheet.getRows();
    const existing = rows.find(
      (r) => String(r.get("Expense_ID")) === String(id)
    );
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    existing.set("Date", body.date);
    existing.set("Category", body.category);
    existing.set("Amount", body.amount);
    existing.set("Description", body.description || "");
    existing.set("Employee_Name", body.employeeName);
    existing.set("Job_Role", body.jobRole || "");
    existing.set("Payment_Month", body.paymentMonth);
    existing.set("Allowance", Number(body.allowance) || 0); // 🆕
    existing.set("Salary", Number(body.salary) || 0); // 🆕
    // Recorded_By አይቀየርም (የተመዘገበው ሰው)
    await existing.save();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── DELETE: Remove expense ───
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = normalizeRole((session.user as any).role);
  const email = String(session.user?.email || "");
  const canDelete = await hasPermission(email, role, "canDeleteExpense");
  if (!canDelete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const sheet = await getSheet("Expense_TBL");
    const rows = await sheet.getRows();
    const existing = rows.find(
      (r) => String(r.get("Expense_ID")) === String(id)
    );
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await existing.delete();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
