// src/app/api/sales/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";

export const revalidate = 0;

/**
 * GET /api/sales/history?q=&from=&to=&status=&staff=&sort=date_desc&page=1&limit=20
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").toLowerCase().trim();
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const status = (searchParams.get("status") || "all").toLowerCase();
    const staff = (searchParams.get("staff") || "").toLowerCase().trim();
    const sort = searchParams.get("sort") || "date_desc";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(5, Number(searchParams.get("limit") || 20)));

    // ─── Load sales + items ───
    const [salesSheet, itemsSheet] = await Promise.all([
      getSheet(SHEETS.SALES),
      getSheet(SHEETS.SALES_ITEMS),
    ]);
    const [salesRows, itemRows] = await Promise.all([
      salesSheet.getRows(),
      itemsSheet.getRows(),
    ]);

    const items = itemRows.map((r) => r.toObject());

    // Group items by Sales_ID
    const itemsBySale: Record<string, any[]> = {};
    for (const it of items) {
      const sid = String(it.Sales_ID ?? "");
      if (!itemsBySale[sid]) itemsBySale[sid] = [];
      itemsBySale[sid].push({
        salesItemId: it.Sales_Item_ID,
        itemId: it.Item_ID,
        itemName: it.Item_Name,
        sellingPrice: Number(it.Selling_Price ?? 0),
        quantity: Number(it.Quantity ?? 0),
        totalPrice: Number(it.Total_Price ?? 0),
        costPerItem: Number(it.Cost_Per_Item ?? 0),
        totalCost: Number(it.Total_Cost_Amount ?? 0),
      });
    }

    // ─── Normalize sales ───
    let rows = salesRows.map((r) => {
      const obj = r.toObject() as any;
      const salesId = String(obj.Sales_ID ?? "");
      const saleItems = itemsBySale[salesId] ?? [];
      return {
        salesId,
        date: String(obj.Date ?? ""),
        customerName: String(obj.Customer_Name ?? "Walk-in"),
        staffName: String(obj.Recorded_By ?? ""),
        totalAmount: Number(obj.Total_Amount ?? 0),
        discount: Number(obj.Discount ?? 0),
        paidAmount: Number(obj.Paid_Amount ?? 0),
        paymentStatus: String(obj.Payment_Status ?? "Paid"),
        paymentMethod: String(obj.Payment_Method ?? "Cash"),
        invoiceNo: String(obj.Invoice_No ?? ""),
        saleStatus: String(obj.Sale_Status ?? "Completed"),
        items: saleItems,
      };
    });

    // ─── Apply filters ───
    if (q) {
      rows = rows.filter(
        (s) =>
          s.invoiceNo.toLowerCase().includes(q) ||
          s.customerName.toLowerCase().includes(q) ||
          s.staffName.toLowerCase().includes(q) ||
          s.salesId.toLowerCase().includes(q)
      );
    }
    if (from) {
      const fromDate = new Date(from);
      rows = rows.filter((s) => {
        const d = new Date(s.date);
        return !isNaN(d.getTime()) && d >= fromDate;
      });
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      rows = rows.filter((s) => {
        const d = new Date(s.date);
        return !isNaN(d.getTime()) && d <= toDate;
      });
    }
    if (status !== "all") {
      rows = rows.filter((s) => s.paymentStatus.toLowerCase() === status);
    }
    if (staff) {
      rows = rows.filter((s) => s.staffName.toLowerCase().includes(staff));
    }

    // ─── Sort ───
    switch (sort) {
      case "date_asc":
        rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case "amount_desc":
        rows.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case "amount_asc":
        rows.sort((a, b) => a.totalAmount - b.totalAmount);
        break;
      case "date_desc":
      default:
        rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    // ─── Pagination ───
    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const pageRows = rows.slice(start, start + limit);

    // ─── Totals for the filtered set ───
    const summary = rows.reduce(
      (acc, s) => ({
        revenue: acc.revenue + s.totalAmount,
        paid: acc.paid + s.paidAmount,
        count: acc.count + 1,
      }),
      { revenue: 0, paid: 0, count: 0 }
    );

    return NextResponse.json({
      rows: pageRows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      summary: {
        revenue: round2(summary.revenue),
        paid: round2(summary.paid),
        outstanding: round2(summary.revenue - summary.paid),
        count: summary.count,
      },
    });
  } catch (e: any) {
    console.error("Sales history error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
