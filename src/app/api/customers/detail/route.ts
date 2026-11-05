// src/app/api/customers/detail/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCachedRows } from "@/lib/sheets-cache";
import { SHEETS } from "@/lib/google-sheets";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const customerName = searchParams.get("name") || "";
    const customerId = searchParams.get("id") || "";

    if (!customerName && !customerId) {
      return NextResponse.json({ error: "name or id required" }, { status: 400 });
    }

    // ─── Load customer ───
    const customerData = await getCachedRows("Customer_TBL");
    const customerRow = customerData.find((obj) => {
      if (customerId && String(obj.Customer_ID) === customerId) return true;
      if (customerName && String(obj.Customer_Name || "").toLowerCase() === customerName.toLowerCase())
        return true;
      return false;
    });

    if (!customerRow) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customer = {
      id: String(customerRow.Customer_ID || ""),
      name: String(customerRow.Customer_Name || ""),
      phone: String(customerRow.Phone_Number || ""),
      type: String(customerRow.Customer_Type || "Regular"),
      email: String(customerRow.Customer_Email || ""),
      address: String(customerRow.Address || ""),
      recordedBy: String(customerRow.Recorded_By || ""),
    };

    // ─── Load sales history ───
    const [salesData, salesItemsData] = await Promise.all([
      getCachedRows(SHEETS.SALES),
      getCachedRows(SHEETS.SALES_ITEMS),
    ]);

    const customerSales = salesData.filter((s: any) => {
      const name = String(s.Customer_Name || "").trim().toLowerCase();
      return name === customer.name.toLowerCase();
    });

    const customerSaleIds = new Set(customerSales.map((s: any) => String(s.Sales_ID)));

    // Group items by sale
    const itemsBySale: Record<string, any[]> = {};
    for (const it of salesItemsData) {
      const sid = String(it.Sales_ID);
      if (!customerSaleIds.has(sid)) continue;
      if (!itemsBySale[sid]) itemsBySale[sid] = [];
      itemsBySale[sid].push(it);
    }

    // Build transaction list (exclude Voided/Refunded)
    const transactions = customerSales
      .filter((s: any) => {
        const status = String(s.Sale_Status || "").toLowerCase();
        return status !== "voided" && status !== "refunded";
      })
      .map((s: any) => {
        const sid = String(s.Sales_ID);
        const items = itemsBySale[sid] ?? [];
        return {
          salesId: sid,
          date: String(s.Date || ""),
          invoiceNo: String(s.Invoice_No || ""),
          totalAmount: Number(s.Total_Amount || 0),
          discount: Number(s.Discount || 0),
          paidAmount: Number(s.Paid_Amount || 0),
          paymentStatus: String(s.Payment_Status || "Paid"),
          paymentMethod: String(s.Payment_Method || "Cash"),
          staffName: String(s.Recorded_By || ""),
          items: items.map((it: any) => ({
            itemId: String(it.Item_ID || ""),
            itemName: String(it.Item_Name || ""),
            sellingPrice: Number(it.Selling_Price || 0),
            quantity: Number(it.Quantity || 0),
            totalPrice: Number(it.Total_Price || 0),
          })),
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // ─── Stats ───
    const totalAmount = transactions.reduce((s, t) => s + t.totalAmount, 0);
    const totalPaid = transactions.reduce((s, t) => s + t.paidAmount, 0);
    const totalPurchases = transactions.length;
    const lastPurchase = transactions[0]?.date || "";

    return NextResponse.json({
      customer,
      stats: {
        totalAmount: round2(totalAmount),
        totalPaid: round2(totalPaid),
        outstanding: round2(totalAmount - totalPaid),
        totalPurchases,
        lastPurchase,
      },
      transactions,
    });
  } catch (e: any) {
    console.error("Customer detail error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
