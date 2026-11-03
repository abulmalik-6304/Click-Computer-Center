// src/app/admin/sales/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCachedRows } from "@/lib/sheets-cache";
import { SHEETS } from "@/lib/google-sheets";
import { calculateAllStock } from "@/lib/inventory-stock";
import { hasPermission } from "@/lib/permissions";
import SalesPOS from "./SalesPOS";

export const revalidate = 0;
export const dynamic = "force-dynamic";

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
  searchParams?: { item?: string; open?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = String((session.user as any).role || "staff").toLowerCase();
  const email = String(session.user?.email || "");

  const preselectedItemId = searchParams?.item || "";
  const autoOpen = searchParams?.open === "1";

  let inventory: any[] = [];
  let customers: Customer[] = [];

  try {
    const stockMap = await calculateAllStock();
    const invData = await getCachedRows(SHEETS.INVENTORY);

    inventory = invData
      .map((obj) => {
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
      .filter((i) => i.status !== "Archived" && i.sellingPrice > 0);

    try {
      const custData = await getCachedRows("Customer_TBL");
      customers = custData.map((obj) => ({
        id: String(obj.Customer_ID || ""),
        name: String(obj.Customer_Name || ""),
        phone: String(obj.Phone_Number || ""),
        type: String(obj.Customer_Type || "Regular"),
        email: String(obj.Customer_Email || ""),
      }));
    } catch {
      customers = [];
    }
  } catch (e) {
    console.error("Sales page load error:", e);
  }

  // ✅ Check all permissions
  const canViewActivity = await hasPermission(email, role, "canViewActivity");
  const canVoid = await hasPermission(email, role, "canVoid");
  const canRefund = await hasPermission(email, role, "canRefund");
  const canDelete = await hasPermission(email, role, "canDelete");

  return (
    <SalesPOS
      initialInventory={inventory}
      initialCustomers={customers}
      initialRecentSales={[]}
      initialPreselectedItemId={preselectedItemId}
      initialAutoOpen={autoOpen}
      userRole={role}
      userName={session.user?.name ?? "User"}
      canViewActivity={canViewActivity}
      canVoid={canVoid}
      canRefund={canRefund}
      canDelete={canDelete}
    />
  );
}
