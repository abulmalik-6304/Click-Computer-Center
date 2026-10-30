// src/app/admin/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import {
  calculateTodaysSalesTotal,
  calculateTodaysCostTotal,
  calculateTodaysExpensesTotal,
  calculateNetProfit,
} from "@/lib/financial-engine";
import { buildEnrichedSales, mapExpenseRow } from "@/lib/data-mappers";
import DashboardClient from "./DashboardClient";

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
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userRole = String((session.user as any).role || "staff").toLowerCase();

  // ─── ዳታ መጫን ───
  let sales: any[] = [];
  let expenses: any[] = [];
  let inventory: any[] = [];

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

    // ኢንቨንትሪ
    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();
    inventory = invRows.map((r) => r.toObject());
  } catch (e) {
    console.error("Dashboard load error:", e);
  }

  // ─── Announcements ───
  const announcements = await loadAnnouncements(userRole);

  // ═══════════════════════════════════════════════════════════
  // ⚠️ FINANCIAL CALCULATIONS — DO NOT INLINE. Use engine only.
  // ═══════════════════════════════════════════════════════════
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const todaySales = calculateTodaysSalesTotal(sales as any, today);
  const todayCost = calculateTodaysCostTotal(sales as any, today);
  const todayExpenses = calculateTodaysExpensesTotal(expenses as any, today);
  const netProfit = calculateNetProfit(sales as any, expenses as any, today);

  const yestSales = calculateTodaysSalesTotal(sales as any, yesterdayStr);
  const yestCost = calculateTodaysCostTotal(sales as any, yesterdayStr);
  const yestExpenses = calculateTodaysExpensesTotal(expenses as any, yesterdayStr);
  const yestProfit = calculateNetProfit(sales as any, expenses as any, yesterdayStr);

  // ─── 7-day trend ───
  const trend7d: { date: string; revenue: number; profit: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    trend7d.push({
      date: key,
      revenue: calculateTodaysSalesTotal(sales as any, key),
      profit: calculateNetProfit(sales as any, expenses as any, key),
    });
  }

  // ─── Low stock ───
  const lowStock = inventory
    .filter(
      (r: any) =>
        Number(r.Stock_Quantity ?? r.stock ?? 0) <=
        Number(r.Reorder_Level ?? r.minStock ?? 10)
    )
    .slice(0, 5)
    .map((r: any) => ({
      id: String(r.Item_ID || ""),
      name: String(r.Item_Name || ""),
      code: String(r.Item_Code || ""),
      stock: Number(r.Stock_Quantity ?? r.stock ?? 0),
    }));

  // ─── Recent sales ───
  const recentSales = sales
    .slice()
    .sort((a: any, b: any) =>
      String(b.date).localeCompare(String(a.date))
    )
    .slice(0, 5)
    .map((s: any) => ({
      id: s.salesId,
      invoiceNo: s.invoiceNo || s.salesId,
      date: s.date,
      customer: s.customerName || "Walk-in",
      staff: s.staffId || "—",
      amount: Number(s.totalAmount || 0),
    }));

  // ─── Recent announcements ───
  const recentAnnouncements = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    date: a.date,
  }));

  // ─── Deltas ───
  const pct = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / Math.abs(prev)) * 1000) / 10;
  };

  // ─── Initial data for client ───
  const initialData = {
    ts: Date.now(),
    today: {
      sales: todaySales,
      cost: todayCost,
      expenses: todayExpenses,
      profit: netProfit,
      transactions: sales.filter((s: any) => s.date?.includes(today)).length,
    },
    yesterday: {
      sales: yestSales,
      cost: yestCost,
      expenses: yestExpenses,
      profit: yestProfit,
    },
    deltas: {
      sales: pct(todaySales, yestSales),
      cost: pct(todayCost, yestCost),
      expenses: pct(todayExpenses, yestExpenses),
      profit: pct(netProfit, yestProfit),
    },
    trend7d,
    lowStock,
    recentSales,
    recentAnnouncements,
  };

  return <DashboardClient initialData={initialData} />;
}
