// src/app/admin/digital-orders/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSheet } from "@/lib/google-sheets";
import { normalizeRole } from "@/lib/roles";
import DigitalOrdersClient from "./DigitalOrdersClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const SHEET = "Digital_Orders_TBL";

export default async function DigitalOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return (
      <div className="p-10 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
          <p className="text-4xl mb-3">🚫</p>
          <h1 className="text-xl font-bold text-red-900 mb-2">
            Access Denied
          </h1>
          <p className="text-sm text-red-700">
            Only owner/manager can view digital orders.
          </p>
        </div>
      </div>
    );
  }

  let orders: any[] = [];
  try {
    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();
    orders = rows
      .map((r) => {
        const o = r.toObject() as any;
        return {
          id: String(o.Order_ID || ""),
          productId: String(o.Product_ID || ""),
          productTitle: String(o.Product_Title || ""),
          price: Number(o.Price || 0),
          customerName: String(o.Customer_Name || ""),
          customerPhone: String(o.Customer_Phone || ""),
          customerEmail: String(o.Customer_Email || ""),
          paymentMethod: String(o.Payment_Method || ""),
          paymentReference: String(o.Payment_Reference || ""),
          paymentAmount: Number(o.Payment_Amount || 0),
          downloadToken: String(o.Download_Token || ""),
          downloadCount: Number(o.Download_Count || 0),
          downloadLimit: Number(o.Download_Limit || 0),
          status: String(o.Status || "pending").toLowerCase(),
          notes: String(o.Notes || ""),
          createdAt: String(o.Created_At || ""),
          approvedAt: String(o.Approved_At || ""),
          approvedBy: String(o.Approved_By || ""),
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  } catch {}

  return <DigitalOrdersClient initialOrders={orders} userRole={role} />;
}
