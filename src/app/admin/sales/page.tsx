// src/app/admin/sales/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import SalesPOS from "./SalesPOS";

export const revalidate = 0;

export interface Customer {
  id: string;
  name: string;
  phone: string;
  type: string;
  email: string;
}

export interface Sale {
  salesId: string;
  date: string;
  customerName: string;
  staffName: string;
  totalAmount: number;
  discount: number;
  paidAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  invoiceNo: string;
  saleStatus: string;
  items: any[];
}

export default async function SalesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = String((session.user as any).role || "staff").toLowerCase();

  let inventory: any[] = [];
  let customers: Customer[] = [];
  let recentSales: Sale[] = [];

  try {
    // Inventory (only items in stock)
    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();
    inventory = invRows
      .map((r) => {
        const obj = r.toObject() as any;
        return {
          id: String(obj.Item_ID || ""),
          name: String(obj.Item_Name || ""),
          code: String(obj.Item_Code || ""),
          image: String(obj.Item_Image || ""),
          stock: Number(obj.Stock_Quantity || 0),
          sellingPrice: Number(obj.Selling_Price || 0),
          costPrice: Number(obj.Avg_Cost || obj.Cost_Price || 0),
          unitType: String(obj.Unit_Type || "pcs"),
          status: String(obj.Status || "Active"),
        };
      })
      .filter(
        (i) => i.status !== "Archived" && i.stock > 0 && i.sellingPrice > 0
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

    // Recent sales
    const [salesSheet, itemSheet] = await Promise.all([
      getSheet(SHEETS.SALES),
      getSheet(SHEETS.SALES_ITEMS),
    ]);
    const [salesRows, itemRows] = await Promise.all([
      salesSheet.getRows(),
      itemSheet.getRows(),
    ]);

    const itemsBySale: Record<string, any[]> = {};
    for (const it of itemRows) {
      const obj = it.toObject() as any;
      const sid = String(obj.Sales_ID);
      if (!itemsBySale[sid]) itemsBySale[sid] = [];
      itemsBySale[sid].push(obj);
    }

    recentSales = salesRows
      .map((r) => {
        const obj = r.toObject() as any;
        const sid = String(obj.Sales_ID || "");
        return {
          salesId: sid,
          date: String(obj.Date || ""),
          customerName: String(obj.Customer_Name || "Walk-in"),
          staffName: String(obj.Recorded_By || ""),
          totalAmount: Number(obj.Total_Amount || 0),
          discount: Number(obj.Discount || 0),
          paidAmount: Number(obj.Paid_Amount || 0),
          paymentStatus: String(obj.Payment_Status || "Paid"),
          paymentMethod: String(obj.Payment_Method || "Cash"),
          invoiceNo: String(obj.Invoice_No || ""),
          saleStatus: String(obj.Sale_Status || "Completed"),
          items: itemsBySale[sid] ?? [],
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  } catch (e) {
    console.error("Sales page load error:", e);
  }

  return (
    <SalesPOS
      initialInventory={inventory}
      initialCustomers={customers}
      initialRecentSales={recentSales}
      userRole={role}
      userName={session.user?.name ?? "User"}
    />
  );
}
