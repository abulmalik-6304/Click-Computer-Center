// src/app/admin/customers/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCachedRows } from "@/lib/sheets-cache";
import { SHEETS } from "@/lib/google-sheets";
import { hasPermission } from "@/lib/permissions";
import { normalizeRole } from "@/lib/roles";
import CustomersClient from "./CustomersClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  type: string;
  email: string;
  address: string;
  recordedBy: string;
  totalPurchases: number;
  totalAmount: number;
  lastPurchase: string;
  transactionCount: number;
}

export interface CustomerWithStats extends Customer {}

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = normalizeRole((session.user as any).role);
  const email = String(session.user?.email || "");

  // ✅ Check print permission
  const canPrint = await hasPermission(email, role, "canPrintCustomers");

  let customers: Customer[] = [];

  try {
    const [customerData, salesData] = await Promise.all([
      getCachedRows("Customer_TBL"),
      getCachedRows(SHEETS.SALES),
    ]);

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

    customers = customerData.map((obj, idx) => {
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
  } catch (e) {
    console.error("Customers load error:", e);
  }

  return (
    <CustomersClient
      initialCustomers={customers}
      userRole={role}
      canPrint={canPrint} // ✅ አዲስ
    />
  );
}
