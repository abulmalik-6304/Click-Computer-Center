// src/app/admin/income/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSheet } from "@/lib/google-sheets";
import IncomeClient from "./IncomeClient";

export const revalidate = 0;

export interface IncomeItem {
  id: string;
  date: string;
  incomeSource: string;
  price: number;
  quantity: number;
  totalPrice: number;
  recordedBy: string;
  incomeCategory: string;
  description: string;
  grossIncome: number;
  usedMaterial: string;
  costPriceMain: number;
  packSize: number;
  usedQty: number;
  materialCost: number;
  netIncome: number;
}

export default async function IncomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = String((session.user as any).role || "staff").toLowerCase();

  let income: IncomeItem[] = [];
  try {
    const sheet = await getSheet("Income_TBL");
    const rows = await sheet.getRows();
    income = rows
      .map((r) => {
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
          costPriceMain: Number(obj["Cost_Price_ Maine"] || 0),
          packSize: Number(obj.Pack_Size || 0),
          usedQty: Number(obj.Used_Qty || 0),
          materialCost: Number(obj.Material_Cost || 0),
          netIncome: Number(obj.Net_Income || 0),
        };
      })
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  } catch {
    income = [];
  }

  return <IncomeClient initialIncome={income} userRole={role} />;
}
