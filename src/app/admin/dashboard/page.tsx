import { getSheet, SHEETS } from "@/lib/google-sheets";
import {
  calculateTodaysSalesTotal,
  calculateTodaysCostTotal,
  calculateTodaysExpensesTotal,
  calculateNetProfit,
  SaleRecord,
  ExpenseRecord,
} from "@/lib/financial-engine";

export const revalidate = 0; // Dynamic data fetching for live Google Sheets sync

async function loadSales(): Promise<SaleRecord[]> {
  try {
    const sheet = await getSheet(SHEETS.SALES);
    const rows = await sheet.getRows();
    return rows.map((r) => ({
      id: r.get("id") || r.get("ID") || "",
      date: r.get("date") || r.get("Date") || "",
      productId: r.get("productId") || r.get("Product_ID") || "",
      productName: r.get("productName") || r.get("Item_Name") || r.get("Product_Name") || "",
      quantity: Number(r.get("quantity") || r.get("Quantity") || 1),
      unitPrice: Number(r.get("unitPrice") || r.get("Unit_Price") || 0),
      unitCost: Number(r.get("unitCost") || r.get("Unit_Cost") || 0),
      Total_Price: r.get("Total_Price") ? Number(r.get("Total_Price")) : undefined,
      Total_Cost_Amount: r.get("Total_Cost_Amount") ? Number(r.get("Total_Cost_Amount")) : undefined,
      staffId: r.get("staffId") || r.get("Recorded_By") || "",
    }));
  } catch (error) {
    console.error("Error loading sales sheet:", error);
    return [];
  }
}

async function loadExpenses(): Promise<ExpenseRecord[]> {
  try {
    const sheet = await getSheet(SHEETS.EXPENSES);
    const rows = await sheet.getRows();
    return rows.map((r) => ({
      id: r.get("id") || r.get("ID") || "",
      date: r.get("date") || r.get("Date") || "",
      category: r.get("category") || r.get("Category") || "General",
      amount: Number(r.get("amount") || r.get("Amount") || 0),
    }));
  } catch (error) {
    console.error("Error loading expenses sheet:", error);
    return [];
  }
}

export default async function DashboardPage() {
  const [sales, expenses] = await Promise.all([loadSales(), loadExpenses()]);
  const today = new Date().toISOString().slice(0, 10);

  const todaySales = calculateTodaysSalesTotal(sales, today);
  const todayCost = calculateTodaysCostTotal(sales, today);
  const todayExpenses = calculateTodaysExpensesTotal(expenses, today);
  const netProfit = calculateNetProfit(sales, expenses, today);

  const cards = [
    { label: "Today's Sales", value: todaySales, accent: "text-emerald-600" },
    { label: "Today's Cost", value: todayCost, accent: "text-slate-700" },
    { label: "Today's Expenses", value: todayExpenses, accent: "text-orange-600" },
    { label: "Net Profit", value: netProfit, accent: netProfit >= 0 ? "text-emerald-600" : "text-red-600" },
  ];

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Click Computer Center — Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Live sync with Google Sheets · {today}</p>
        </div>
      </div>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => (
          <div key={c.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-medium text-slate-500">{c.label}</p>
            <p className={`mt-2 text-3xl font-bold ${c.accent}`}>
              {c.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
