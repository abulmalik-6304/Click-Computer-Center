// src/app/api/dashboard/live/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, SHEETS } from "@/lib/google-sheets";
import { buildEnrichedSales, mapExpenseRow } from "@/lib/data-mappers";
import {
  calculateTodaysSalesTotal,
  calculateTodaysCostTotal,
  calculateTodaysExpensesTotal,
  calculateNetProfit,
} from "@/lib/financial-engine";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ─── Load ───
    const [salesSheet, itemSheet] = await Promise.all([
      getSheet(SHEETS.SALES),
      getSheet(SHEETS.SALES_ITEMS),
    ]);
    const [salesRows, itemRows] = await Promise.all([
      salesSheet.getRows(),
      itemSheet.getRows(),
    ]);
    const sales = buildEnrichedSales(
      salesRows.map((r) => r.toObject()),
      itemRows.map((r) => r.toObject())
    );

    const expSheet = await getSheet(SHEETS.EXPENSES);
    const expRows = await expSheet.getRows();
    const expenses = expRows.map((r) => mapExpenseRow(r.toObject()));

    const invSheet = await getSheet(SHEETS.INVENTORY);
    const invRows = await invSheet.getRows();
    const inventory = invRows.map((r) => r.toObject());

    const annSheet = await getSheet("Announcements_TBL").catch(() => null);
    const annRows = annSheet ? await annSheet.getRows() : [];

    // ─── Dates ───
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    // ─── KPIs ───
    const todaySales = calculateTodaysSalesTotal(sales as any, today);
    const todayCost = calculateTodaysCostTotal(sales as any, today);
    const todayExpenses = calculateTodaysExpensesTotal(expenses as any, today);
    const netProfit = calculateNetProfit(sales as any, expenses as any, today);

    const yestSales = calculateTodaysSalesTotal(sales as any, yesterdayStr);
    const yestCost = calculateTodaysCostTotal(sales as any, yesterdayStr);
    const yestExpenses = calculateTodaysExpensesTotal(expenses as any, yesterdayStr);
    const yestProfit = calculateNetProfit(sales as any, expenses as any, yesterdayStr);

    // ─── 7-day trend for sparkline ───
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

    // ─── Inventory stats ───
    const inventoryStats = {
      total: inventory.length,
      lowStock: inventory.filter((r: any) => {
        const stock = Number(r.Stock_Quantity ?? r.stock ?? 0);
        const reorder = Number(r.Reorder_Level ?? 10);
        return stock > 0 && stock <= reorder;
      }).length,
      outOfStock: inventory.filter(
        (r: any) => Number(r.Stock_Quantity ?? r.stock ?? 0) === 0
      ).length,
      totalValue: inventory.reduce((sum, r: any) => {
        const stock = Number(r.Stock_Quantity ?? r.stock ?? 0);
        const cost = Number(r.Avg_Cost ?? r.Cost_Price ?? 0);
        return sum + stock * cost;
      }, 0),
    };

    const lowStock = inventory
      .filter((r: any) => {
        const stock = Number(r.Stock_Quantity ?? r.stock ?? 0);
        const reorder = Number(r.Reorder_Level ?? 10);
        return stock > 0 && stock <= reorder;
      })
      .slice(0, 5)
      .map((r: any) => ({
        id: String(r.Item_ID || ""),
        name: String(r.Item_Name || ""),
        code: String(r.Item_Code || ""),
        stock: Number(r.Stock_Quantity ?? 0),
      }));

    // ─── Recent sales (last 5) ───
    const recentSales = sales
      .slice()
      .sort((a: any, b: any) => String(b.date).localeCompare(String(a.date)))
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
    const recentAnnouncements = annRows
      .map((r) => r.toObject() as any)
      .filter((a) => String(a.Status || "").toLowerCase() === "active")
      .sort((a, b) => String(b.Date).localeCompare(String(a.Date)))
      .slice(0, 3)
      .map((a) => ({
        id: String(a.Announcement_ID || ""),
        title: String(a.Title || ""),
        date: String(a.Date || ""),
      }));

    // ─── Deltas ───
    const pct = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / Math.abs(prev)) * 1000) / 10;
    };

    return NextResponse.json({
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
      inventoryStats, // ✅ አዲስ
      recentSales,
      recentAnnouncements,
    });
  } catch (e: any) {
    console.error("Live dashboard error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
