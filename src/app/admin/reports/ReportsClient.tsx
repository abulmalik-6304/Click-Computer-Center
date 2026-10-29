// src/app/admin/reports/ReportsClient.tsx
"use client";

import { useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  DateRangeKey, getRangeDates,
  summarize, dailyTrend, topProducts, topStaff, paymentBreakdown,
} from "@/lib/analytics";

const RANGE_LABELS: Record<DateRangeKey, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  year: "This Year",
  all: "All Time",
};

const PIE_COLORS = ["#f97316", "#10b981", "#0ea5e9", "#a855f7", "#ef4444", "#f59e0b"];

export default function ReportsClient({
  sales,
  expenses,
}: {
  sales: any[];
  expenses: any[];
}) {
  const [range, setRange] = useState<DateRangeKey>("30d");
  const { from, to } = useMemo(() => getRangeDates(range), [range]);

  const kpi = useMemo(() => summarize(sales, expenses, from, to), [sales, expenses, from, to]);
  const trend = useMemo(() => dailyTrend(sales, from, to), [sales, from, to]);
  const products = useMemo(() => topProducts(sales, from, to, 8), [sales, from, to]);
  const staff = useMemo(() => topStaff(sales, from, to, 8), [sales, from, to]);
  const payments = useMemo(() => paymentBreakdown(sales, from, to), [sales, from, to]);

  const rangeOptions: DateRangeKey[] = ["today", "7d", "30d", "90d", "year", "all"];

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">📊 Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            {from.toLocaleDateString()} — {to.toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Range Picker */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap gap-2">
        {rangeOptions.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              range === r
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Revenue" value={kpi.revenue} color="emerald" icon="💰" />
        <KpiCard label="Total Cost" value={kpi.cost} color="slate" icon="📦" />
        <KpiCard label="Gross Profit" value={kpi.grossProfit} color={kpi.grossProfit >= 0 ? "emerald" : "red"} icon="📈" />
        <KpiCard label="Net Profit" value={kpi.netProfit} color={kpi.netProfit >= 0 ? "emerald" : "red"} icon="💎" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat label="Transactions" value={kpi.transactions} />
        <MiniStat label="Avg Ticket" value={`${kpi.avgTicket.toLocaleString()} ETB`} />
        <MiniStat label="Expenses" value={`${kpi.expenses.toLocaleString()} ETB`} />
        <MiniStat label="Unique Customers" value={kpi.uniqueCustomers} />
      </div>

      {/* Revenue / Profit trend (line) */}
      <Card title="Revenue & Profit Trend">
        {trend.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={(v: any) => `${Number(v).toLocaleString()} ETB`}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" dot={false} />
              <Line type="monotone" dataKey="profit" stroke="#f97316" strokeWidth={2} name="Profit" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Two column: Products + Staff */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="🏆 Top Products">
          {products.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={products} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#334155" }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: any) => `${Number(v).toLocaleString()} ETB`}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 6, 6, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="👥 Top Staff">
          {staff.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={staff} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#334155" }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: any) => `${Number(v).toLocaleString()} ETB`}
                />
                <Bar dataKey="revenue" fill="#f97316" radius={[0, 6, 6, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Payment methods pie */}
      <Card title="💳 Payment Methods">
        {payments.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 gap-4 items-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={payments}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(e: any) => e.name}
                >
                  {payments.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: any) => `${Number(v).toLocaleString()} ETB`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {payments.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-slate-700 font-medium">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {p.value.toLocaleString()} ETB
                    </p>
                    <p className="text-xs text-slate-500">{p.count} sales</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="text-center text-xs text-slate-400 pt-4">
        📊 All figures derived from frozen financial engine · Never recomputed inline
      </div>
    </div>
  );
}

// ─── Components ───

function KpiCard({
  label, value, color, icon,
}: { label: string; value: number; color: string; icon: string }) {
  const cls = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  }[color] ?? "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className={`p-5 rounded-2xl border ${cls}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium opacity-75">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">
        {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <p className="text-xs opacity-60 mt-1">ETB</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h2 className="font-bold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-12 text-center text-slate-400 text-sm">
      No data for the selected range
    </div>
  );
}
