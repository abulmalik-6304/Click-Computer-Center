// src/lib/analytics.ts
// ═══════════════════════════════════════════════════════════════
// 📊 ANALYTICS — READ-ONLY AGGREGATIONS
// ⚠️  DO NOT re-implement financial formulas here.
// ⚠️  All per-line money math delegates to financial-engine.ts.
// ═══════════════════════════════════════════════════════════════

import {
  SaleRecord,
  ExpenseRecord,
  calculateLineRevenue,
  calculateLineCost,
  calculateLineProfit,
} from "./financial-engine";

// ─── Date helpers ───
export type DateRangeKey = "today" | "7d" | "30d" | "90d" | "year" | "all";

export function getRangeDates(key: DateRangeKey): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let from: Date;
  switch (key) {
    case "today":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "7d":
      from = new Date(now); from.setDate(now.getDate() - 6); from.setHours(0, 0, 0, 0);
      break;
    case "30d":
      from = new Date(now); from.setDate(now.getDate() - 29); from.setHours(0, 0, 0, 0);
      break;
    case "90d":
      from = new Date(now); from.setDate(now.getDate() - 89); from.setHours(0, 0, 0, 0);
      break;
    case "year":
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case "all":
    default:
      from = new Date(2020, 0, 1);
      break;
  }
  return { from, to };
}

function parseDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function inRange(dateStr: string | undefined, from: Date, to: Date): boolean {
  const d = parseDate(dateStr);
  if (!d) return false;
  return d >= from && d <= to;
}

// ─── KPI summary ───
export interface KpiSummary {
  revenue: number;
  cost: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
  transactions: number;
  avgTicket: number;
  uniqueCustomers: number;
}

export function summarize(
  sales: SaleRecord[],
  expenses: ExpenseRecord[],
  from: Date,
  to: Date
): KpiSummary {
  const inRangeSales = sales.filter((s) => inRange(s.date ?? (s as any).Date, from, to));
  const inRangeExpenses = expenses.filter((e) => inRange(e.date ?? (e as any).Date, from, to));

  const revenue = round2(inRangeSales.reduce((s, x) => s + calculateLineRevenue(x), 0));
  const cost = round2(inRangeSales.reduce((s, x) => s + calculateLineCost(x), 0));
  const expTotal = round2(inRangeExpenses.reduce((s, x) => s + Number(x.amount ?? 0), 0));
  const grossProfit = round2(revenue - cost);
  const netProfit = round2(grossProfit - expTotal);

  const customers = new Set<string>();
  for (const s of inRangeSales) {
    const c = String((s as any).customerName ?? (s as any).Customer_Name ?? "").trim();
    if (c && c.toLowerCase() !== "walk-in") customers.add(c.toLowerCase());
  }

  return {
    revenue,
    cost,
    expenses: expTotal,
    grossProfit,
    netProfit,
    transactions: inRangeSales.length,
    avgTicket: inRangeSales.length > 0 ? round2(revenue / inRangeSales.length) : 0,
    uniqueCustomers: customers.size,
  };
}

// ─── Daily trend (for line chart) ───
export interface DailyPoint {
  date: string;
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  transactions: number;
}

export function dailyTrend(
  sales: SaleRecord[],
  from: Date,
  to: Date
): DailyPoint[] {
  const buckets = new Map<string, DailyPoint>();
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  while (cur <= end) {
    const key = cur.toISOString().slice(0, 10);
    buckets.set(key, {
      date: key,
      label: cur.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: 0,
      cost: 0,
      profit: 0,
      transactions: 0,
    });
    cur.setDate(cur.getDate() + 1);
  }

  for (const s of sales) {
    const d = parseDate(s.date ?? (s as any).Date);
    if (!d) continue;
    const key = d.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (!b) continue;
    b.revenue += calculateLineRevenue(s);
    b.cost += calculateLineCost(s);
    b.profit += calculateLineProfit(s);
    b.transactions++;
  }

  return Array.from(buckets.values()).map((b) => ({
    ...b,
    revenue: round2(b.revenue),
    cost: round2(b.cost),
    profit: round2(b.profit),
  }));
}

// ─── Top products (bar chart) ───
export interface ProductStat {
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export function topProducts(
  sales: SaleRecord[],
  from: Date,
  to: Date,
  limit = 8
): ProductStat[] {
  const map = new Map<string, ProductStat>();
  for (const s of sales) {
    const dateStr = s.date ?? (s as any).Date;
    if (!inRange(dateStr, from, to)) continue;
    const name =
      (s as any).productName ||
      (s as any).Item_Name ||
      (s as any).itemName ||
      "Unknown";
    const key = String(name).trim();
    if (!map.has(key)) map.set(key, { name: key, quantity: 0, revenue: 0, profit: 0 });
    const b = map.get(key)!;
    b.quantity += Number((s as any).quantity ?? 0);
    b.revenue += calculateLineRevenue(s);
    b.profit += calculateLineProfit(s);
  }
  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((p) => ({
      ...p,
      revenue: round2(p.revenue),
      profit: round2(p.profit),
    }));
}

// ─── Top staff (bar chart) ───
export interface StaffStat {
  name: string;
  transactions: number;
  revenue: number;
}

export function topStaff(
  sales: SaleRecord[],
  from: Date,
  to: Date,
  limit = 8
): StaffStat[] {
  const map = new Map<string, StaffStat>();
  for (const s of sales) {
    const dateStr = s.date ?? (s as any).Date;
    if (!inRange(dateStr, from, to)) continue;
    const name =
      (s as any).staffId ||
      (s as any).Recorded_By ||
      (s as any).recordedBy ||
      "Unknown";
    const key = String(name).trim();
    if (!map.has(key)) map.set(key, { name: key, transactions: 0, revenue: 0 });
    const b = map.get(key)!;
    b.transactions++;
    b.revenue += calculateLineRevenue(s);
  }
  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((p) => ({ ...p, revenue: round2(p.revenue) }));
}

// ─── Payment method breakdown (pie chart) ───
export interface PaymentStat {
  name: string;
  value: number;
  count: number;
}

export function paymentBreakdown(
  sales: SaleRecord[],
  from: Date,
  to: Date
): PaymentStat[] {
  const map = new Map<string, PaymentStat>();
  for (const s of sales) {
    const dateStr = s.date ?? (s as any).Date;
    if (!inRange(dateStr, from, to)) continue;
    const method = String((s as any).paymentMethod ?? (s as any).Payment_Method ?? "Cash");
    if (!map.has(method)) map.set(method, { name: method, value: 0, count: 0 });
    const b = map.get(method)!;
    b.value += calculateLineRevenue(s);
    b.count++;
  }
  return Array.from(map.values()).map((p) => ({ ...p, value: round2(p.value) }));
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
