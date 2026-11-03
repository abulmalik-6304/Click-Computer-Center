// src/app/admin/sales/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { calculateAllStock } from "@/lib/inventory-stock";
import SalesPOS from "./SalesPOS";

export const revalidate = 0;

export interface Customer {
  id: string;
  name: string;
  phone: string;
  type: string;
  email: string;
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams?: { item?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = String((session.user as any).role || "staff").toLowerCase();
  const preselectedItemId = searchParams?.item || "";

  let inventory: any[] = [];
  let customers: Customer[] = [];

  try {
    // ✅ Calculate stock from purchases/sales
    const stockMap = await calculateAllStock();

    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();
    inventory = invRows
      .map((r) => {
        const obj = r.toObject() as any;
        const itemId = String(obj.Item_ID || "");

        const calc = stockMap[itemId];
        const stock = calc?.currentStock ?? 0;

        return {
          id: itemId,
          name: String(obj.Item_Name || ""),
          code: String(obj.Item_Code || ""),
          category: String(obj.Category || obj.Unit_Type || "General"),
          image: String(obj.Item_Image || ""),
          stock,
          sellingPrice: Number(obj.Selling_Price || 0),
          costPrice: Number(obj.Avg_Cost || obj.Cost_Price || 0),
          unitType: String(obj.Unit_Type || "pcs"),
          status: String(obj.Status || "Active"),
        };
      })
      .filter(
        (i) => i.status !== "Archived" && i.sellingPrice > 0
      );

    // Customers
    try {
      const custSheet = await getSheet("Customer_TBL");
      const custRows = await custSheet.getRows();
      customers = custRows.map((r) => {
        const obj = r.toObject() as any;
        return {
          id: String(obj.Customer_ID || ""),
          name: String(obj.Customer_Name || ""),
          phone: String(obj.Phone_Number || ""),
          type: String(obj.Customer_Type || "Regular"),
          email: String(obj.Customer_Email || ""),
        };
      });
    } catch {
      customers = [];
    }
  } catch (e) {
    console.error("Sales page load error:", e);
  }

  return (
    <SalesPOS
      initialInventory={inventory}
      initialCustomers={customers}
      initialRecentSales={[]}
      initialPreselectedItemId={preselectedItemId}
      userRole={role}
      userName={session.user?.name ?? "User"}
    />
  );
}
