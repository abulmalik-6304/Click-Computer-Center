// src/app/admin/suppliers/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSheet } from "@/lib/google-sheets";
import SuppliersClient from "./SuppliersClient";

export const revalidate = 0;

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

  let suppliers: Supplier[] = [];
  try {
    const sheet = await getSheet("Supplier_TBL");
    const rows = await sheet.getRows();
    suppliers = rows.map((r) => {
      const obj = r.toObject() as any;
      return {
        id: String(obj.Supplier_ID || ""),
        name: String(obj.Supplier_Name || ""),
        phone: String(obj.Phone_Number || ""),
        company: String(obj.Company_Name || ""),
        supplyItem: String(obj.Supply_Item || ""),
        address: String(obj.Address || ""),
      };
    });
  } catch {
    suppliers = [];
  }

  return <SuppliersClient initialSuppliers={suppliers} />;
}
