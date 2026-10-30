// src/app/admin/customers/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import CustomersClient from "./CustomersClient";

export const revalidate = 0;

export interface Customer {
  id: string;
  name: string;
  phone: string;
  type: string;
  email: string;
  address: string;
  recordedBy: string;
}

export interface CustomerWithStats extends Customer {
  totalPurchases: number;
  totalAmount: number;
  lastPurchase: string;
  transactionCount: number;
}

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  let customers: Customer[] = [];
  let salesByName: Record<string, { amount: number; count: number; last: string }> = {};

  try {
    const sheet = await getSheet("Customer_TBL");
    const rows = await sheet.getRows();
    customers = rows.map((r) => {
      const obj = r.toObject() as any;
      return {
        id: String(obj.Customer_ID || ""),
        name: String(obj.Customer_Name || ""),
        phone: String(obj.Phone_Number || ""),
        type: String(obj.Customer_Type || "Regular"),
        email: String(obj.Customer_Email || ""),
        address: String(obj.Address || ""),
        recordedBy: String(obj.Recorded_By || ""),
      };
    });

    // Sales stats by customer name
    try {
      const salesSheet = await getSheet(SHEETS.SALES);
      const salesRows = await salesSheet.getRows();
      for (const r of salesRows) {
        const obj = r.toObject() as any;
        const name = String(obj.Customer_Name || "Walk-in").trim().toLowerCase();
        const amount = Number(obj.Total_Amount || 0);
        const date = String(obj.Date || "");
        if (!salesByName[name]) {
          salesByName[name] = { amount: 0, count: 0, last: "" };
        }
        salesByName[name].amount += amount;
        salesByName[name].count += 1;
        if (!salesByName[name].last || date > salesByName[name].last) {
          salesByName[name].last = date;
        }
      }
    } catch {
      // skip
    }
  } catch {
    customers = [];
  }

  const withStats: CustomerWithStats[] = customers.map((c) => {
    const stats = salesByName[c.name.trim().toLowerCase()];
    return {
      ...c,
      totalPurchases: stats?.count ?? 0,
      totalAmount: stats?.amount ?? 0,
      lastPurchase: stats?.last ?? "",
      transactionCount: stats?.count ?? 0,
    };
  });

  return <CustomersClient initialCustomers={withStats} />;
}
