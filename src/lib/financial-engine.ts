// ═══════════════════════════════════════════════════════════════
// ⚠️  PROTECTED FINANCIAL CALCULATION ENGINE
// ⚠️  DO NOT MODIFY WITHOUT OWNER APPROVAL
// ═══════════════════════════════════════════════════════════════

export interface SaleRecord {
  id: string;
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  staffId: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
}

export function calculateLineCost(sale: SaleRecord): number {
  return round2(sale.unitCost * sale.quantity);
}

export function calculateLineRevenue(sale: SaleRecord): number {
  return round2(sale.unitPrice * sale.quantity);
}

export function calculateLineProfit(sale: SaleRecord): number {
  return round2((sale.unitPrice - sale.unitCost) * sale.quantity);
}

export function calculateTodaysSalesTotal(
  sales: SaleRecord[],
  today: string = new Date().toISOString().slice(0, 10)
): number {
  return round2(
    sales
      .filter((s) => s.date.slice(0, 10) === today)
      .reduce((sum, s) => sum + calculateLineRevenue(s), 0)
  );
}

export function calculateTodaysCostTotal(
  sales: SaleRecord[],
  today: string = new Date().toISOString().slice(0, 10)
): number {
  return round2(
    sales
      .filter((s) => s.date.slice(0, 10) === today)
      .reduce((sum, s) => sum + calculateLineCost(s), 0)
  );
}

export function calculateTodaysExpensesTotal(
  expenses: ExpenseRecord[],
  today: string = new Date().toISOString().slice(0, 10)
): number {
  return round2(
    expenses
      .filter((e) => e.date.slice(0, 10) === today)
      .reduce((sum, e) => sum + e.amount, 0)
  );
}

export function calculateNetProfit(
  sales: SaleRecord[],
  expenses: ExpenseRecord[],
  today?: string
): number {
  const salesTotal = today
    ? calculateTodaysSalesTotal(sales, today)
    : round2(sales.reduce((s, x) => s + calculateLineRevenue(x), 0));
  const costTotal = today
    ? calculateTodaysCostTotal(sales, today)
    : round2(sales.reduce((s, x) => s + calculateLineCost(x), 0));
  const expTotal = today
    ? calculateTodaysExpensesTotal(expenses, today)
    : round2(expenses.reduce((s, x) => s + x.amount, 0));

  return round2(salesTotal - costTotal - expTotal);
}

export function deductInventory(
  currentStock: number,
  quantitySold: number
): number {
  const next = currentStock - quantitySold;
  if (next < 0) {
    throw new Error(
      `Insufficient stock: have ${currentStock}, tried to sell ${quantitySold}`
    );
  }
  return next;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
