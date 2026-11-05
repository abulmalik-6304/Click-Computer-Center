// src/app/admin/suppliers/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCachedRows } from "@/lib/sheets-cache";
import SuppliersClient from "./SuppliersClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  company: string;
  supplyItem: string;
  address: string;
}

export default async function SuppliersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = String((session.user as any).role || "staff").toLowerCase();

  let suppliers: Supplier[] = [];

  try {
    const data = await getCachedRows("Supplier_TBL");

    suppliers = data.map((obj, idx) => ({
      id: String(obj.Supplier_ID || `SUP-${idx + 1}`),
      name: String(obj.Supplier_Name || ""),
      phone: String(obj.Phone_Number || ""),
      company: String(obj.Company_Name || ""),
      supplyItem: String(obj.Supply_Item || ""),
      address: String(obj.Address || ""),
    }));
  } catch (e) {
    console.error("Suppliers load error:", e);
  }

  return <SuppliersClient initialSuppliers={suppliers} userRole={role} />;
}
