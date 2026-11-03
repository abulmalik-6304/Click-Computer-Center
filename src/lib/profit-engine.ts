// src/lib/profit-engine.ts
// ═══════════════════════════════════════════════════════════════
// 💵 PROFIT ENGINE — Exact AppSheet formula implementation
// ═══════════════════════════════════════════════════════════════

import {
  calculateLineRevenue,
  calculateLineCost,
} from "./financial-engine";
import { getCachedRows } from "./sheets-cache";
import { SHEETS } from "./google-sheets";

export interface ProfitInput {
  year: number;
  month: number; // 1-12
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  count: number;
}

export interface ProfitCalculation {
  // Income
  salesRevenue: number;
  incomeRevenue: number;
  totalIncome: number;

  // Costs
  salesCost: number;
  materialCost: number;
  totalCost: number;

  // Expenses
  totalExpenses: number;
  expensesByCategory: ExpenseCategory[];

  // Shared expenses
  staffSharedExpenses: number;
  sharedCategories: string[];

  // Profit
  balance: number;
  netSalesProfit: number;
  staffProfit: number;
  ownerProfit: number;
  staffSharePercent: number;
  ownerSharePercent: number;

  // Transactions
  salesCount: number;
  incomeCount: number;
  expenseCount: number;
}

export interface ProfitConfig {
  // Which categories count as staff-shared
  sharedExpenseCategories: string[];
  // Number of people to divide shared expenses
  sharedDivisor: number;
  // Manager's share of profit (percent)
  staffSharePercent: number;
  // Additional staff with custom shares
  additionalStaff: { email: string; name: string; percent: number }[];
}

export const DEFAULT_CONFIG: ProfitConfig = {
  sharedExpenseCategories: ["የቤት ወጪ"],
  sharedDivisor: 3,
  staffSharePercent: 50,
  additionalStaff: [],
};

// ═══════════════════════════════════════════════════════════════
// 🧮 MAIN CALCULATION
// ═══════════════════════════════════════════════════════════════
export async function calculateProfit(
  input: ProfitInput,
  config: ProfitConfig = DEFAULT_CONFIG
): Promise<ProfitCalculation> {
  const { year, month } = input;

  // Load sheets
  const [salesData, itemsData, incomeData, expensesData] = await Promise.all([
    getCachedRows(SHEETS.SALES),
    getCachedRows(SHEETS.SALES_ITEMS),
    getCachedRows(SHEETS.INCOME),
    getCachedRows(SHEETS.EXPENSES),
  ]);

  // ═══════════════════════════════════════════════════════════════
  // 1️⃣ Sales — filter by month + status
  // ═══════════════════════════════════════════════════════════════
  const monthSales = salesData.filter((s: any) => {
    const status = String(s.Sale_Status || "").toLowerCase();
    if (status === "voided" || status === "refunded") return false;
    const d = new Date(String(s.Date || ""));
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  const salesIds = new Set(monthSales.map((s: any) => String(s.Sales_ID)));

  // ═══════════════════════════════════════════════════════════════
  // 2️⃣ Sales_Items — for this month's sales
  // ═══════════════════════════════════════════════════════════════
  const monthItems = itemsData.filter((it: any) =>
    salesIds.has(String(it.Sales_ID))
  );

  // Total_Sales = SUM(Sales_Items.Total_Price)
  const salesRevenue = monthItems.reduce((sum, it) => {
    const record = {
      quantity: Number(it.Quantity || 0),
      unitPrice: Number(it.Selling_Price || 0),
      unitCost: Number(it.Cost_Per_Item || 0),
      Total_Price: Number(it.Total_Price || 0),
    };
    return sum + calculateLineRevenue(record as any);
  }, 0);

  // Sales_Items.Total_Cost_Amount
  const salesCost = monthItems.reduce((sum, it) => {
    const record = {
      quantity: Number(it.Quantity || 0),
      unitPrice: Number(it.Selling_Price || 0),
      unitCost: Number(it.Cost_Per_Item || 0),
      Total_Cost_Amount: Number(it.Total_Cost_Amount || 0),
    };
    return sum + calculateLineCost(record as any);
  }, 0);

  // ═══════════════════════════════════════════════════════════════
  // 3️⃣ Income_TBL — for this month
  // ═══════════════════════════════════════════════════════════════
  const monthIncome = incomeData.filter((i: any) => {
    const d = new Date(String(i.Date || ""));
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  const incomeRevenue = monthIncome.reduce(
    (sum, i) => sum + Number(i.Total_Price || 0),
    0
  );

  const materialCost = monthIncome.reduce(
    (sum, i) => sum + Number(i.Material_Cost || 0),
    0
  );

  // ═══════════════════════════════════════════════════════════════
  // 4️⃣ Expense_TBL — for this month
  // ═══════════════════════════════════════════════════════════════
  const monthExpenses = expensesData.filter((e: any) => {
    const d = new Date(String(e.Date || ""));
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  const totalExpenses = monthExpenses.reduce(
    (sum, e) => sum + Number(e.Amount || 0),
    0
  );

  // Group by category
  const expenseMap = new Map<string, { amount: number; count: number }>();
  for (const e of monthExpenses) {
    const cat = String(e.Category || "Other");
    const existing = expenseMap.get(cat) || { amount: 0, count: 0 };
    expenseMap.set(cat, {
      amount: existing.amount + Number(e.Amount || 0),
      count: existing.count + 1,
    });
  }

  const expensesByCategory: ExpenseCategory[] = Array.from(expenseMap.entries())
    .map(([category, data]) => ({
      category,
      amount: round2(data.amount),
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  // ═══════════════════════════════════════════════════════════════
  // 5️⃣ Staff_Shared_Expenses — from configured categories
  // ═══════════════════════════════════════════════════════════════
  const sharedCategories = config.sharedExpenseCategories || [];
  const staffSharedExpenses = monthExpenses
    .filter((e) =>
      sharedCategories.some(
        (cat) => String(e.Category || "").trim() === cat.trim()
      )
    )
    .reduce((sum, e) => sum + Number(e.Amount || 0), 0);

  // ═══════════════════════════════════════════════════════════════
  // 6️⃣ Formulas
  // ═══════════════════════════════════════════════════════════════
  const totalIncome = salesRevenue + incomeRevenue;
  const totalCost = salesCost + materialCost;
  const balance = totalIncome - totalExpenses;
  const netSalesProfit = salesRevenue - salesCost;

  const sharedDivisor = config.sharedDivisor || 3;
  const staffSharePercent = config.staffSharePercent || 50;

  // Staff_Profit = (Total_Income − Total_Expenses − Total_Cost 
  //                 − (Staff_Shared_Expenses ÷ Divisor)) × (Staff % / 100)
  const adjustedProfit =
    totalIncome -
    totalExpenses -
    totalCost -
    staffSharedExpenses / sharedDivisor;

  const staffProfit = round2(adjustedProfit * (staffSharePercent / 100));
  const ownerProfit = round2(totalIncome - totalExpenses - staffProfit);

  return {
    salesRevenue: round2(salesRevenue),
    incomeRevenue: round2(incomeRevenue),
    totalIncome: round2(totalIncome),
    salesCost: round2(salesCost),
    materialCost: round2(materialCost),
    totalCost: round2(totalCost),
    totalExpenses: round2(totalExpenses),
    expensesByCategory,
    staffSharedExpenses: round2(staffSharedExpenses),
    sharedCategories,
    balance: round2(balance),
    netSalesProfit: round2(netSalesProfit),
    staffProfit,
    ownerProfit,
    staffSharePercent,
    ownerSharePercent: round2(100 - staffSharePercent),
    salesCount: monthSales.length,
    incomeCount: monthIncome.length,
    expenseCount: monthExpenses.length,
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
