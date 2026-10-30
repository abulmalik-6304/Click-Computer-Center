// src/app/admin/dashboard/DashboardClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TrendCard from "@/components/admin/dashboard/TrendCard";
import MiniSparkline from "@/components/admin/dashboard/MiniSparkline";
import ActivityFeed from "@/components/admin/dashboard/ActivityFeed";
import QuickActions from "@/components/admin/dashboard/QuickActions";
import LiveClock from "@/components/admin/dashboard/LiveClock";

const REFRESH_MS = 30_000;

interface LiveData {
  ts: number;
  today: {
    sales: number;
    cost: number;
    expenses: number;
    profit: number;
    transactions: number;
  };
  yesterday: {
    sales: number;
    cost: number;
    expenses: number;
    profit: number;
  };
  deltas: {
    sales: number;
    cost: number;
    expenses: number;
    profit: number;
  };
  trend7d: { date: string; revenue: number; profit: number }[];
  lowStock: { id: string; name: string; code: string; stock: number }[];
  recentSales: {
    id: string;
    invoiceNo: string;
    date: string;
    customer: string;
    staff: string;
    amount: number;
  }[];
  recentAnnouncements: { id: string; title: string; date: string }[];
}

export default function DashboardClient({ initialData }: { initialData: LiveData }) {
  const [data, setData] = useState<LiveData>(initialData);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/live", { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Failed");
        return;
      }
      setData(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(t);
  }, [autoRefresh]);

  const { today, deltas } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
          <LiveClock lastUpdate={data.ts} />
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="accent-emerald-600"
            />
            Auto-refresh
          </label>
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "🔄 Refresh"}
          </button>
          <Link
            href="/admin/sales"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg"
          >
            + New Sale
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <TrendCard
          label="Today's Sales"
          value={today.sales}
          delta={deltas.sales}
          icon="💰"
          color="emerald"
          sub={`${today.transactions} transactions`}
        />
        <TrendCard
          label="Today's Cost"
          value={today.cost}
          delta={deltas.cost}
          icon="📦"
          color="slate"
          sub="Cost of goods sold"
          invertDelta
        />
        <TrendCard
          label="Today's Expenses"
          value={today.expenses}
          delta={deltas.expenses}
          icon="📉"
          color="orange"
          sub="Operating expenses"
          invertDelta
        />
        <TrendCard
          label="Net Profit"
          value={today.profit}
          delta={deltas.profit}
          icon={today.profit >= 0 ? "📈" : "📉"}
          color={today.profit >= 0 ? "emerald" : "red"}
          sub={today.profit >= 0 ? "Positive" : "Loss"}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* 7-day trend */}
      <MiniSparkline data={data.trend7d} title="📈 7-Day Revenue & Profit" />

      {/* Activity + Low Stock */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ActivityFeed
          recentSales={data.recentSales}
          recentAnnouncements={data.recentAnnouncements}
        />

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">⚠️ Low Stock</h2>
            <Link
              href="/admin/inventory"
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              Manage →
            </Link>
          </div>
          {data.lowStock.length === 0 ? (
            <p className="p-6 text-sm text-emerald-600 text-center">
              ✅ All items are well-stocked
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.lowStock.map((i) => (
                <div
                  key={i.id}
                  className="p-4 hover:bg-slate-50 transition flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{i.name}</p>
                    <p className="text-xs text-slate-500">{i.code}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold">
                    {i.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
