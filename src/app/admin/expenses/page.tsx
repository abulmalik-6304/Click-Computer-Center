// src/app/admin/expenses/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSheet } from "@/lib/google-sheets";
import { hasPermission } from "@/lib/permissions";
import { normalizeRole } from "@/lib/roles";
import ExpenseClient from "./ExpenseClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  recordedBy: string;
  employeeName: string;
  jobRole: string;
  paymentMonth: string;
}

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = normalizeRole((session.user as any).role);
  const email = String(session.user?.email || "");

  // ✅ Permissions
  const canAddExpense = await hasPermission(email, role, "canAddExpense");
  const canEditExpense = await hasPermission(email, role, "canEditExpense");
  const canDeleteExpense = await hasPermission(email, role, "canDeleteExpense");
  const canExportExpense = await hasPermission(email, role, "canExportExpense");
  const canPrintExpense = await hasPermission(email, role, "canPrintExpense");
  const canViewActivity = await hasPermission(email, role, "canViewActivity");

  // ✅ Load expenses
  let expenses: ExpenseItem[] = [];
  try {
    const sheet = await getSheet("Expense_TBL");
    const rows = await sheet.getRows();
    expenses = rows
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
        };
      })
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  } catch {
    expenses = [];
  }

  return (
    <ExpenseClient
      initialExpenses={expenses}
      userRole={role}
      canAddExpense={canAddExpense}
      canEditExpense={canEditExpense}
      canDeleteExpense={canDeleteExpense}
      canExportExpense={canExportExpense}
      canPrintExpense={canPrintExpense}
      canViewActivityLog={canViewActivity}
    />
  );
}
