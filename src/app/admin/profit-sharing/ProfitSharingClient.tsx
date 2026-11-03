// src/app/admin/profit-sharing/ProfitSharingClient.tsx
"use client";

import { useEffect, useState } from "react";

interface Calculation {
  salesRevenue: number;
  incomeRevenue: number;
  totalIncome: number;
  salesCost: number;
  materialCost: number;
  totalCost: number;
  totalExpenses: number;
  expensesByCategory: { category: string; amount: number; count: number }[];
  staffSharedExpenses: number;
  sharedCategories: string[];
  balance: number;
  netSalesProfit: number;
  staffProfit: number;
  ownerProfit: number;
  staffSharePercent: number;
  ownerSharePercent: number;
  salesCount: number;
  incomeCount: number;
  expenseCount: number;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function fmt(n: any): string {
  const num = Number(n);
  return isNaN(num) ? "0" : num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ProfitSharingClient() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [calc, setCalc] = useState<Calculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/profit-sharing?year=${year}&month=${month}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setCalc(data.calculation);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [year, month]);

  function printReport() {
    if (!calc) return;
    const html = `
      <html><head><title>Profit Report — ${MONTHS[month - 1]} ${year}</title>
      <style>
        body{font-family:Arial;padding:30px;max-width:700px;margin:0 auto;color:#0f172a}
        h1{font-size:22px;margin:0 0 4px}
        .small{font-size:12px;color:#666}
        table{width:100%;border-collapse:collapse;font-size:14px;margin:15px 0}
        th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd}
        th{background:#f1f5f9;font-weight:bold}
        .right{text-align:right}
        .total{font-weight:bold;font-size:16px;background:#f0fdf4}
        .owner{background:#fef3c7}
        .staff{background:#dbeafe}
        .footer{margin-top:40px;text-align:center;color:#94a3b8;font-size:11px}
      </style></head><body>
        <h1>Click Computer Center</h1>
        <p class="small">Profit Report — ${MONTHS[month - 1]} ${year}</p>
        <p class="small">Generated: ${new Date().toLocaleString()}</p>

        <h3>📊 Income</h3>
        <table>
          <tr><td>Sales Revenue</td><td class="right">${fmt(calc.salesRevenue)}</td></tr>
          <tr><td>Income Revenue</td><td class="right">${fmt(calc.incomeRevenue)}</td></tr>
          <tr class="total"><td>Total Income</td><td class="right">${fmt(calc.totalIncome)}</td></tr>
        </table>

        <h3>💸 Costs</h3>
        <table>
          <tr><td>Sales Cost</td><td class="right">${fmt(calc.salesCost)}</td></tr>
          <tr><td>Material Cost</td><td class="right">${fmt(calc.materialCost)}</td></tr>
          <tr class="total"><td>Total Cost</td><td class="right">${fmt(calc.totalCost)}</td></tr>
        </table>

        <h3>📉 Expenses</h3>
        <table>
          ${calc.expensesByCategory.map(e => 
            `<tr><td>${e.category} (${e.count})</td><td class="right">${fmt(e.amount)}</td></tr>`
          ).join("")}
          <tr class="total"><td>Total Expenses</td><td class="right">${fmt(calc.totalExpenses)}</td></tr>
        </table>

        <h3>🏠 Shared (${calc.sharedCategories.join(", ")})</h3>
        <p>Total: ${fmt(calc.staffSharedExpenses)} ETB</p>

        <h3>💵 Profit Split</h3>
        <table>
          <tr><td>Net Sales Profit</td><td class="right">${fmt(calc.netSalesProfit)}</td></tr>
          <tr><td>Balance</td><td class="right">${fmt(calc.balance)}</td></tr>
          <tr class="staff"><td>Manager (${calc.staffSharePercent}%)</td><td class="right">${fmt(calc.staffProfit)}</td></tr>
          <tr class="owner"><td>Owner (${calc.ownerSharePercent}%)</td><td class="right">${fmt(calc.ownerProfit)}</td></tr>
        </table>

        <p class="small">
          Transactions: ${calc.salesCount} sales · ${calc.incomeCount} income · ${calc.expenseCount} expenses
        </p>
        <p class="footer">Click Computer Center · Confidential</p>
      </body></html>
    `;
    const w = window.open("", "_blank", "width=750,height=900");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 400);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            💵 Profit Report
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monthly profit breakdown with staff sharing
          </p>
        </div>
        <button
          onClick={printReport}
          disabled={!calc}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
        >
          🖨 Print Report
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Period selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-3 items-center">
        <label className="text-sm font-semibold text-slate-700">Period:</label>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg disabled:opacity-50"
        >
          {loading ? "⟳" : "🔄"} Refresh
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="mt-3 text-sm text-slate-500">Calculating…</p>
        </div>
      ) : calc ? (
        <>
          {/* KPI Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi label="Total Income" value={calc.totalIncome} color="emerald" icon="💰" />
            <Kpi label="Total Cost" value={calc.totalCost} color="orange" icon="📦" />
            <Kpi label="Total Expenses" value={calc.totalExpenses} color="red" icon="📉" />
            <Kpi
              label="Balance"
              value={calc.balance}
              color={calc.balance >= 0 ? "emerald" : "red"}
              icon="💎"
            />
          </div>

          {/* Income Breakdown */}
          <Section title="📊 Income Breakdown">
            <Row label="Sales Revenue" value={calc.salesRevenue} />
            <Row label="Income Revenue" value={calc.incomeRevenue} />
            <Row label="Total Income" value={calc.totalIncome} bold highlight />
          </Section>

          {/* Cost Breakdown */}
          <Section title="📦 Cost Breakdown">
            <Row label="Sales Cost" value={calc.salesCost} />
            <Row label="Material Cost" value={calc.materialCost} />
            <Row label="Total Cost" value={calc.totalCost} bold highlight />
          </Section>

          {/* Expenses */}
          <Section title="📉 Expenses">
            {calc.expensesByCategory.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-2">
                No expenses this month
              </p>
            ) : (
              <>
                {calc.expensesByCategory.map((e) => (
                  <Row
                    key={e.category}
                    label={`${e.category} (${e.count})`}
                    value={e.amount}
                  />
                ))}
                <Row label="Total Expenses" value={calc.totalExpenses} bold highlight />
              </>
            )}
          </Section>

          {/* Shared Expenses */}
          <Section title={`🏠 Staff-Shared Expenses (${calc.sharedCategories.join(", ")})`}>
            <Row label="Shared Total" value={calc.staffSharedExpenses} />
            <p className="text-xs text-slate-500 pt-2">
              ℹ️ These are excluded from Staff Profit calculation and divided equally
            </p>
          </Section>

          {/* Profit Split */}
          <div className="bg-white rounded-2xl border-2 border-emerald-200 overflow-hidden">
            <div className="p-5 border-b border-emerald-100 bg-emerald-50">
              <h2 className="font-bold text-slate-900 text-lg">💵 Profit Split</h2>
              <p className="text-xs text-slate-600 mt-1">
                Net profit divided between Owner and Manager
              </p>
            </div>

            <div className="p-5 space-y-2">
              <Row label="Net Sales Profit" value={calc.netSalesProfit} />

              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                  <p className="text-xs font-semibold text-amber-700">👑 Owner ({calc.ownerSharePercent}%)</p>
                  <p className="mt-2 text-2xl font-bold text-amber-700">
                    {fmt(calc.ownerProfit)} ETB
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <p className="text-xs font-semibold text-blue-700">📊 Manager ({calc.staffSharePercent}%)</p>
                  <p className="mt-2 text-2xl font-bold text-blue-700">
                    {fmt(calc.staffProfit)} ETB
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
              {calc.salesCount} sales · {calc.incomeCount} income · {calc.expenseCount} expenses
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Kpi({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  const cls =
    {
      emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
      orange: "text-orange-700 bg-orange-50 border-orange-200",
      red: "text-red-700 bg-red-50 border-red-200",
      slate: "text-slate-700 bg-slate-50 border-slate-200",
    }[color] ?? "text-slate-700 bg-slate-50 border-slate-200";

  return (
    <div className={`${cls} p-4 rounded-2xl border`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium opacity-75">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="mt-1 text-xl font-bold">
        {value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
      <p className="text-xs opacity-60">ETB</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
    children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h2 className="font-bold text-slate-900 mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: number;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex justify-between text-sm ${
        highlight ? "pt-2 border-t border-slate-200" : ""
      }`}
    >
      <span className={bold ? "font-semibold text-slate-900" : "text-slate-600"}>
        {label}
      </span>
      <span className={bold ? "font-bold text-slate-900" : "text-slate-900"}>
        {fmt(value)} ETB
      </span>
    </div>
  );
}
