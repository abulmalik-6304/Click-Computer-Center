// src/app/api/admin/digital-orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet } from "@/lib/google-sheets";
import { normalizeRole } from "@/lib/roles";

const ORDERS_SHEET = "Digital_Orders_TBL";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ✅ GET: List all orders (with filters)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const search = (searchParams.get("search") || "").toLowerCase().trim();

    const sheet = await getSheet(ORDERS_SHEET);
    const rows = await sheet.getRows();

    let orders = rows.map((r) => {
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
    });

    // Filters
    if (status !== "all") {
      orders = orders.filter((o) => o.status === status);
    }
    if (search) {
      orders = orders.filter(
        (o) =>
          o.customerName.toLowerCase().includes(search) ||
          o.customerPhone.toLowerCase().includes(search) ||
          o.productTitle.toLowerCase().includes(search) ||
          o.id.toLowerCase().includes(search)
      );
    }

    orders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Stats
    const stats = {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      approved: orders.filter((o) => o.status === "approved").length,
      rejected: orders.filter((o) => o.status === "rejected").length,
      revenue: orders
        .filter((o) => o.status === "approved")
        .reduce((s, o) => s + o.price, 0),
    };

    return NextResponse.json({ orders, stats });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({
        orders: [],
        stats: { total: 0, pending: 0, approved: 0, rejected: 0, revenue: 0 },
      });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ✅ DELETE: Delete order (permanent)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner") {
    return NextResponse.json(
      { error: "Only owner can delete orders" },
      { status: 403 }
    );
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const sheet = await getSheet(ORDERS_SHEET);
    const rows = await sheet.getRows();
    const row = rows.find((r) => String(r.get("Order_ID")) === String(id));
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await row.delete();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
