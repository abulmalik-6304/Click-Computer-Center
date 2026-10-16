import { getSheet, SHEETS } from '@/lib/google-sheets';
import {
  calculateTodaysSalesTotal,
  calculateTodaysCostTotal,
  calculateTodaysExpensesTotal,
  calculateNetProfit,
  SaleRecord, ExpenseRecord,
} from '@/lib/financial-engine';

async function loadSales(): Promise<SaleRecord[]> {
  const sheet = await getSheet(SHEETS.SALES);
  const rows = await sheet.getRows();
  return rows.map(r => ({
    id: r.get('id'), date: r.get('date'),
    productId: r.get('productId'), productName: r.get('productName'),
    quantity: Number(r.get('quantity')),
    unitPrice: Number(r.get('unitPrice')),
    unitCost: Number(r.get('unitCost')),
    staffId: r.get('staffId'),
  }));
}

async function loadExpenses(): Promise<ExpenseRecord[]> {
  const sheet = await getSheet(SHEETS.EXPENSES);
  const rows = await sheet.getRows();
  return rows.map(r => ({
    id: r.get('id'), date: r.get('date'),
    category: r.get('category'), amount: Number(r.get('amount')),
  }));
}

export default async function DashboardPage() {
  const [sales, expenses] = await Promise.all([loadSales(), loadExpenses()]);
  const today = new Date().toISOString().slice(0, 10);

  // ⚠️ Uses FROZEN financial engine — DO NOT inline calculations here.
  const todaySales = calculateTodaysSalesTotal(sales, today);
  const todayCost = calculateTodaysCostTotal(sales, today);
  const todayExpenses = calculateTodaysExpensesTotal(expenses, today);
  const netProfit = calculateNetProfit(sales, expenses, today);

  const cards = [
    { label: "Today's Sales",   value: todaySales,    accent: 'emerald' },
    { label: "Today's Cost",    value: todayCost,     accent: 'slate'   },
    { label: "Today's Expenses",value: todayExpenses, accent: 'orange'  },
    { label: "Net Profit",      value: netProfit,     accent: netProfit >= 0 ? 'emerald' : 'red' },
  ];

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="text-sm text-slate-500 mt-1">Live sync with Google Sheets · {today}</p>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map(c => (
          <div key={c.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{c.label}</p>
            <p className={`mt-2 text-3xl font-bold text-${c.accent}-600`}>
              {c.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
