// src/app/admin/income/IncomeClient.tsx
"use client";

import { useMemo, useState } from "react";
import {
  INCOME_SOURCES,
  getSourceIcon,
  getSourceLabel,
  getCategoriesForSource,
  SOURCE_COLORS,
  buildSourceBreakdown,
} from "@/lib/income-categories";
import { IncomeItem } from "./page";
import IncomeFormModal from "@/components/admin/income/IncomeFormModal";

type ModalMode = "add" | null;

export default function IncomeClient({
  initialIncome,
  userRole,
}: {
  initialIncome: IncomeItem[];
  userRole: string;
}) {
  const [items, setItems] = useState(initialIncome);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modal, setModal] = useState<ModalMode>(null);
  const [loading, setLoading] = useState(false);

  const canEdit = ["owner", "manager"].includes(userRole);
  const canAdd = ["owner", "manager", "employee", "staff"].includes(userRole);

  const filtered = useMemo(() => {
    let out = items;
    if (q) {
      const lq = q.toLowerCase();
      out = out.filter(
        (i) =>
          i.description.toLowerCase().includes(lq) ||
          i.recordedBy.toLowerCase().includes(lq) ||
          i.incomeCategory.toLowerCase().includes(lq) ||
          i.incomeSource.toLowerCase().includes(lq)
      );
    }
    if (from) {
      const fd = new Date(from);
      out = out.filter((i) => new Date(i.date) >= fd);
    }
    if (to) {
      const td = new Date(to);
      td.setHours(23, 59, 59, 999);
      out = out.filter((i) => new Date(i.date) <= td);
    }
    if (sourceFilter !== "all") {
      out = out.filter(
        (i) => i.incomeSource.toLowerCase() === sourceFilter.toLowerCase()
      );
    }
    if (categoryFilter !== "all") {
      out = out.filter(
        (i) => i.incomeCategory.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    return out;
  }, [items, q, from, to, sourceFilter, categoryFilter]);

  const totals = useMemo(
    () => ({
      gross: filtered.reduce((s, i) => s + i.grossIncome, 0),
      material: filtered.reduce((s, i) => s + i.materialCost, 0),
      net: filtered.reduce((s, i) => s + i.netIncome, 0),
      transactions: filtered.length,
    }),
    [filtered]
  );

  const breakdown = useMemo(
    () =>
      buildSourceBreakdown(
        filtered.map((i) => ({
          incomeSource: i.incomeSource,
          totalPrice: i.totalPrice,
        }))
      ),
    [filtered]
  );

  const filterCategories = useMemo(() => {
    if (sourceFilter === "all") {
      const set = new Set<string>();
      for (const src of INCOME_SOURCES) {
        for (const cat of src.categories) set.add(cat.label);
      }
      return Array.from(set);
    }
    return getCategoriesForSource(sourceFilter).map((c) => c.label);
  }, [sourceFilter]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/income", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.income)) setItems(data.income);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            💰 Income
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {items.length} total · {filtered.length} filtered
          </p>
        </div>
        {canAdd && (
          <button
            onClick={() => setModal("add")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition"
          >
            + Add Income
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Gross Income"
          value={`${totals.gross.toLocaleString()} ETB`}
          color="emerald"
          icon="💵"
        />
        <StatCard
          label="Material Cost"
          value={`${totals.material.toLocaleString()} ETB`}
          color="orange"
          icon="📦"
        />
        <StatCard
          label="Net Income"
          value={`${totals.net.toLocaleString()} ETB`}
          color={totals.net >= 0 ? "emerald" : "red"}
          icon="💎"
        />
        <StatCard
          label="Transactions"
          value={totals.transactions}
          color="slate"
          icon="🧾"
        />
      </div>

      {/* Source Breakdown */}
      {breakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-3">📊 By Source</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {breakdown.map((b) => {
              const pct = totals.gross > 0 ? (b.total / totals.gross) * 100 : 0;
              return (
                <div
                  key={b.source}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {b.icon} {b.sourceLabel}
                    </span>
                    <span className="text-xs text-slate-500">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {b.total.toLocaleString()} ETB
                  </p>
                  <p className="text-xs text-slate-500">
                    {b.count} transactions
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="🔍 Search…"
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 text-sm"
          />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 text-sm"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 text-sm"
          />
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setCategoryFilter("all");
            }}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 text-sm"
          >
            <option value="all">All Sources</option>
            {INCOME_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.icon} {s.label}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 text-sm"
          >
            <option value="all">All Categories</option>
            {filterCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-3 py-3 font-semibold">Date</th>
                <th className="text-left px-3 py-3 font-semibold">Source</th>
                <th className="text-left px-3 py-3 font-semibold hidden md:table-cell">
                  Category
                </th>
                <th className="text-left px-3 py-3 font-semibold hidden lg:table-cell">
                  Description
                </th>
                <th className="text-right px-3 py-3 font-semibold">Gross</th>
                {canEdit && (
                  <th className="text-right px-3 py-3 font-semibold hidden md:table-cell">
                    Cost
                  </th>
                )}
                <th className="text-right px-3 py-3 font-semibold">Net</th>
                {canEdit && (
                  <th className="text-right px-3 py-3 font-semibold">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit ? 8 : 6}
                    className="text-center py-10 text-slate-500"
                  >
                    No income records found
                  </td>
                </tr>
              ) : (
                filtered.map((i) => (
                  <tr
                    key={i.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-3 py-3 text-slate-600">{i.date}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          SOURCE_COLORS[i.incomeSource.toLowerCase()] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {getSourceIcon(i.incomeSource)}{" "}
                        {getSourceLabel(i.incomeSource)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-700 hidden md:table-cell">
                      {i.incomeCategory || "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-600 hidden lg:table-cell">
                      {i.description || "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-emerald-600">
                      +{i.grossIncome.toLocaleString()}
                    </td>
                    {canEdit && (
                      <td className="px-3 py-3 text-right text-slate-600 hidden md:table-cell">
                        {i.materialCost > 0
                          ? `-${i.materialCost.toLocaleString()}`
                          : "—"}
                      </td>
                    )}
                    <td
                      className={`px-3 py-3 text-right font-bold ${
                        i.netIncome >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {i.netIncome.toLocaleString()}
                    </td>
                    {canEdit && (
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={async () => {
                            if (!confirm("Delete this income record?")) return;
                            await fetch("/api/income", {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: i.id }),
                            });
                            refresh();
                          }}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          🗑
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal === "add" && (
        <IncomeFormModal
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

// ─── Components ───

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: any;
  color: string;
  icon: string;
}) {
  const cls =
    {
      emerald: "text-emerald-700 bg-emerald-50",
      orange: "text-orange-700 bg-orange-50",
      red: "text-red-700 bg-red-50",
      slate: "text-slate-700 bg-slate-50",
    }[color] ?? "text-slate-700 bg-slate-50";
  return (
    <div className={`${cls} p-4 rounded-2xl border border-slate-200`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium opacity-75">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
