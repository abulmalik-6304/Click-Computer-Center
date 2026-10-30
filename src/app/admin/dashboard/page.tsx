import { getSheet, SHEETS } from "@/lib/google-sheets";
import {
  calculateTodaysSalesTotal,
  calculateTodaysCostTotal,
  calculateTodaysExpensesTotal,
  calculateNetProfit,
} from "@/lib/financial-engine";
import { buildEnrichedSales, mapExpenseRow } from "@/lib/data-mappers";
import Link from "next/link";

export const revalidate = 0;

interface AnnouncementSummary {
  id: string;
  date: string;
  title: string;
  message: string;
  targetRole: string;
}

async function loadAnnouncements(role: string): Promise<AnnouncementSummary[]> {
  try {
    const sheet = await getSheet("Announcements_TBL");
    const rows = await sheet.getRows();
    let all = rows.map((r) => {
      const obj = r.toObject() as any;
      return {
        id: String(obj.Announcement_ID || ""),
        date: String(obj.Date || ""),
        title: String(obj.Title || ""),
        message: String(obj.Message || ""),
        targetRole: String(obj.Target_Role || "all").toLowerCase(),
        status: String(obj.Status || "Active").toLowerCase(),
      };
    });

    // Only active
    all = all.filter((a) => a.status === "active");

    // Role filter
    const r = role.toLowerCase();
    if (r === "staff") {
      all = all.filter((a) => a.targetRole === "all" || a.targetRole === "staff");
    } else if (r === "manager") {
      all = all.filter(
        (a) =>
          a.targetRole === "all" ||
          a.targetRole === "staff" ||
          a.targetRole === "manager"
      );
    }
    // Owner sees all

    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return all.slice(0, 3);
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  // ─── ዳታ መጫን ───
  let sales: any[] = [];
  let expenses: any[] = [];
  let lowStock: any[] = [];
  let recentSales: any[] = [];
  let announcements: AnnouncementSummary[] = [];

  // ለ role ማወቅ (auth session)
  let userRole = "staff";
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    userRole = String((session?.user as any)?.role || "staff").toLowerCase();
  } catch {
    userRole = "staff";
  }

  try {
    // ሽያጮች (Sales_TBL + Sales_Items_TBL)
    const salesSheet = await getSheet(SHEETS.SALES);
    const itemSheet = await getSheet(SHEETS.SALES_ITEMS);
    const [salesRows, itemRows] = await Promise.all([
      salesSheet.getRows(),
      itemSheet.getRows(),
    ]);
    sales = buildEnrichedSales(
      salesRows.map((r) => r.toObject()),
      itemRows.map((r) => r.toObject())
    );

    // ወጪዎች
    const expSheet = await getSheet(SHEETS.EXPENSES);
    const expRows = await expSheet.getRows();
    expenses = expRows.map((r) => mapExpenseRow(r.toObject()));

    // አነስተኛ ክምችት
    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();
    lowStock = invRows
      .map((r) => r.toObject())
      .filter(
        (r: any) =>
          Number(r.Stock_Quantity ?? r.stock ?? 0) <=
          Number(r.Reorder_Level ?? r.minStock ?? 10)
      )
      .slice(0, 5);

    recentSales = sales.slice(-5).reverse();
  } catch (e) {
    console.error("Dashboard load error:", e);
  }

  // ─── Announcements ───
  announcements = await loadAnnouncements(userRole);

  // ═══════════════════════════════════════════════════════════
  // ⚠️ FINANCIAL CALCULATIONS — DO NOT INLINE. Use engine only.
  // ═══════════════════════════════════════════════════════════
  const today = new Date().toISOString().slice(0, 10);
  const todaySales = calculateTodaysSalesTotal(sales as any, today);
  const todayCost = calculateTodaysCostTotal(sales as any, today);
  const todayExpenses = calculateTodaysExpensesTotal(expenses as any, today);
  const netProfit = calculateNetProfit(sales as any, expenses as any, today);

  const cards = [
    {
      label: "Today's Sales",
      value: todaySales,
      icon: "💰",
      badgeBg: "bg-emerald-50 text-emerald-700",
      valueColor: "text-emerald-600",
      sub: `${sales.filter((s) => s.date?.includes(today)).length} transactions`,
    },
    {
      label: "Today's Cost",
      value: todayCost,
      icon: "📦",
      badgeBg: "bg-slate-100 text-slate-700",
      valueColor: "text-slate-700",
      sub: "Cost of goods sold",
    },
    {
      label: "Today's Expenses",
      value: todayExpenses,
      icon: "📉",
      badgeBg: "bg-orange-50 text-orange-700",
      valueColor: "text-orange-600",
      sub: "Operating expenses",
    },
    {
      label: "Net Profit",
      value: netProfit,
      icon: netProfit >= 0 ? "📈" : "📉",
      badgeBg:
        netProfit >= 0
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700",
      valueColor: netProfit >= 0 ? "text-emerald-600" : "text-red-600",
      sub: netProfit >= 0 ? "Positive Net Profit" : "Operating Loss",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Live sync ·{" "}
            {new Date().toLocaleDateString("en-ET", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Link
          href="/admin/sales"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition shadow-sm text-sm"
        >
          + New Sale
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="text-2xl">{c.icon}</div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${c.badgeBg}`}
              >
                Today
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-500">{c.label}</p>
            <p className={`mt-1 text-2xl sm:text-3xl font-bold ${c.valueColor}`}>
              {c.value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              <span className="text-xs sm:text-sm text-slate-400 ml-1">ETB</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Announcements Widget ─── */}
      {announcements.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              📢 Announcements
            </h2>
            <Link
              href="/admin/announcements"
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {announcements.map((a) => (
              <div key={a.id} className="p-4 hover:bg-slate-50 transition">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">📢</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900">{a.title}</p>
                      <p className="text-xs text-slate-400 flex-shrink-0">
                        {new Date(a.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">
                      {a.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Recent Sales</h2>
            <Link
              href="/admin/sales"
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              View all →
            </Link>
          </div>
          {recentSales.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 text-center">
              No sales yet today
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSales.map((s) => (
                <div
                  key={s.salesId}
                  className="p-4 hover:bg-slate-50 transition flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {s.invoiceNo || s.salesId}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.customerName || "Cash Customer"} ·{" "}
                      {s.staffId || "Admin"}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">
                    {Number(s.totalAmount || 0).toLocaleString()} ETB
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              ⚠️ Low Stock Alert
            </h2>
            <Link
              href="/admin/inventory"
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              Manage →
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="p-6 text-sm text-emerald-600 text-center">
              ✅ All items are well-stocked
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {lowStock.map((item: any, idx: number) => (
                <div
                  key={item.Item_ID || item.id || idx}
                  className="p-4 hover:bg-slate-50 transition flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.Item_Name || item.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.Item_Code || item.category || "General"}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold">
                    {item.Stock_Quantity ?? item.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
