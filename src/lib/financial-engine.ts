// ═══════════════════════════════════════════════════════════════
// ⚠️  PROTECTED FINANCIAL CALCULATION ENGINE
// ⚠️  DO NOT MODIFY WITHOUT OWNER APPROVAL
// ═══════════════════════════════════════════════════════════════

export interface SaleRecord {
  id?: string;
  date?: string;
  Date?: string;
  productId?: string;
  productName?: string;
  Item_Name?: string;
  quantity?: number | string;
  Quantity?: number | string;
  unitPrice?: number | string;
  Total_Price?: number | string;
  unitCost?: number | string;
  Total_Cost_Amount?: number | string;
  staffId?: string;
  Recorded_By?: string;
}

export interface ExpenseRecord {
  id?: string;
  date?: string;
  Date?: string;
  category?: string;
  amount?: number | string;
  Amount?: number | string;
}

export function calculateLineCost(sale: SaleRecord): number {
  const qty = Number(sale.quantity ?? sale.Quantity ?? 1);
  const cost = Number(sale.unitCost ?? 0);
  const totalCost = sale.Total_Cost_Amount !== undefined ? Number(sale.Total_Cost_Amount) : cost * qty;
  return round2(totalCost);
}

export function calculateLineRevenue(sale: SaleRecord): number {
  const qty = Number(sale.quantity ?? sale.Quantity ?? 1);
  const price = Number(sale.unitPrice ?? 0);
  const totalPrice = sale.Total_Price !== undefined ? Number(sale.Total_Price) : price * qty;
  return round2(totalPrice);
}

export function calculateLineProfit(sale: SaleRecord): number {
  const rev = calculateLineRevenue(sale);
  const cost = calculateLineCost(sale);
  return round2(rev - cost);
}

export function calculateTodaysSalesTotal(
  sales: SaleRecord[],
  today: string = new Date().toISOString().slice(0, 10)
): number {
  return round2(
    sales
      .filter((s) => {
        const d = String(s.date ?? s.Date ?? "");
        return d.includes(today) || d === today;
      })
      .reduce((sum, s) => sum + calculateLineRevenue(s), 0)
  );
}

export function calculateTodaysCostTotal(
  sales: SaleRecord[],
  today: string = new Date().toISOString().slice(0, 10)
): number {
  return round2(
    sales
      .filter((s) => {
        const d = String(s.date ?? s.Date ?? "");
        return d.includes(today) || d === today;
      })
      .reduce((sum, s) => sum + calculateLineCost(s), 0)
  );
}

export function calculateTodaysExpensesTotal(
  expenses: ExpenseRecord[],
  today: string = new Date().toISOString().slice(0, 10)
): number {
  return round2(
    expenses
      .filter((e) => {
        const d = String(e.date ?? e.Date ?? "");
        return d.includes(today) || d === today;
      })
      .reduce((sum, e) => sum + Number(e.amount ?? e.Amount ?? 0), 0)
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
    : round2(expenses.reduce((s, x) => s + Number(x.amount ?? x.Amount ?? 0), 0));

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
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
