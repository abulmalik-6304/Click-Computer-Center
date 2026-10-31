// src/app/admin/expenses/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import ExpensesClient from "./ExpensesClient";

export const revalidate = 0;

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

  const role = String((session.user as any).role || "staff").toLowerCase();
  if (!["owner", "manager"].includes(role)) redirect("/admin/dashboard");

  let expenses: ExpenseItem[] = [];
  try {
    const sheet = await getSheet(SHEETS.EXPENSES);
    const rows = await sheet.getRows();
    expenses = rows
      .map((r) => {
        const obj = r.toObject() as any;
        return {
          id: String(obj.Expense_ID || ""),
          date: String(obj.Date || ""),
          category: String(obj.Category || ""),
          amount: Number(obj.Amount || 0),
          description: String(obj.Description || ""),
          recordedBy: String(obj.Recorded_By || ""),
          employeeName: String(obj.Employee_Name || ""),
          jobRole: String(obj.Job_Role || ""),
          paymentMonth: String(obj.Payment_Month || ""),
        };
      })
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  } catch {
    expenses = [];
  }

  return <ExpensesClient initialExpenses={expenses} userRole={role} />;
}
