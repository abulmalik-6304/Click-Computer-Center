// src/app/admin/expenses/ExpensesClient.tsx
"use client";

import { useMemo, useState } from "react";
import {
  EXPENSE_CATEGORIES,
  getCategoryLabel,
  getCategoryIcon,
  EXPENSE_COLORS,
} from "@/lib/expense-categories";
import { ExpenseItem } from "./page";

type ModalMode = "add" | null;

export default function ExpensesClient({
  initialExpenses,
  userRole,
}: {
  initialExpenses: ExpenseItem[];
  userRole: string;
}) {
  const [items, setItems] = useState(initialExpenses);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modal, setModal] = useState<ModalMode>(null);
  const [loading, setLoading] = useState(false);

  const canEdit = ["owner", "manager"].includes(userRole);

  const filtered = useMemo(() => {
    let out = items;
    if (q) {
      const lq = q.toLowerCase();
      out = out.filter(
        (e) =>
          e.description.toLowerCase().includes(lq) ||
          e.recordedBy.toLowerCase().includes(lq) ||
          e.category.toLowerCase().includes(lq)
      );
    }
    if (from) {
      const fd = new Date(from);
      out = out.filter((e) => new Date(e.date) >= fd);
    }
    if (to) {
      const td = new Date(to);
      td.setHours(23, 59, 59, 999);
      out = out.filter((e) => new Date(e.date) <= td);
    }
    if (categoryFilter !== "all") {
      out = out.filter(
        (e) => e.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    return out;
  }, [items, q, from, to, categoryFilter]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  // By-category breakdown
  const byCategory = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    for (const e of filtered) {
      if (!map[e.category]) map[e.category] = { total: 0, count: 0 };
      map[e.category].total += e.amount;
      map[e.category].count++;
    }
    return map;
  }, [filtered]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      if (Array.isArray(data.expenses)) setItems(data.expenses);
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
            📉 Expenses
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {items.length} total · {filtered.length} filtered
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setModal("add")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm transition"
          >
            + Add Expense
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Filtered Total" value={`${total.toLocaleString()} ETB`} color="orange" />
        <StatCard label="This Month" value={`${thisMonthTotal(items).toLocaleString()} ETB`} color="slate" />
        <StatCard label="Transactions" value={filtered.length} color="emerald" />
        <StatCard label="Categories" value={Object.keys(byCategory).length} color="slate" />
      </div>

      {/* By-Category Breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-3">💼 By Category</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(byCategory).map(([cat, stats]) => {
              const label = getCategoryLabel(cat);
              const icon = getCategoryIcon(cat);
              const pct = total > 0 ? (stats.total / total) * 100 : 0;
              return (
                <div key={cat} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {icon} {label}
                    </span>
                    <span className="text-xs text-slate-500">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {stats.total.toLocaleString()} ETB
                  </p>
                  <p className="text-xs text-slate-500">
                    {stats.count} transactions
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="🔍 Search description…"
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 text-sm"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.icon} {c.label}
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
                <th className="text-left px-3 py-3 font-semibold">Category</th>
                <th className="text-left px-3 py-3 font-semibold hidden md:table-cell">Description</th>
                <th className="text-left px-3 py-3 font-semibold hidden lg:table-cell">Recorded By</th>
                <th className="text-right px-3 py-3 font-semibold">Amount</th>
                {canEdit && <th className="text-right px-3 py-3 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="text-center py-10 text-slate-500">
                    No expenses found
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3 text-slate-600">{e.date}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          EXPENSE_COLORS[e.category.toLowerCase()] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {getCategoryIcon(e.category)} {getCategoryLabel(e.category)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-700 hidden md:table-cell">
                      {e.description || "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-600 hidden lg:table-cell">
                      {e.recordedBy || "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-red-600">
                      -{e.amount.toLocaleString()} ETB
                    </td>
                    {canEdit && (
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete this expense?`)) return;
                            await fetch("/api/expenses", {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: e.id }),
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
        <ExpenseForm
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refresh(); }}
        />
      )}
    </div>
  );
}

// ─── Components ───

function StatCard({ label, value, color }: { label: string; value: any; color: string }) {
  const cls = {
    orange: "text-orange-700 bg-orange-50",
    slate: "text-slate-700 bg-slate-50",
    emerald: "text-emerald-700 bg-emerald-50",
  }[color] ?? "text-slate-700 bg-slate-50";
  return (
    <div className={`${cls} p-4 rounded-2xl border border-slate-200`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function ExpenseForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    category: "transport",
    amount: 0,
    description: "",
    date: new Date().toISOString().slice(0, 10),
    paymentMonth: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setSaving(false);
        return;
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">➕ Add Expense</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-xl"
          >
            ✕
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Category *
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Amount (ETB) *
          </label>
          <input
            type="number"
            value={form.amount || ""}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            required
            min={0}
            step={0.01}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Date
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What was this expense for?"
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
        </div>

        {form.category === "salary" && (
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">
              Payment Month
            </label>
            <input
              type="month"
              value={form.paymentMonth}
              onChange={(e) => setForm({ ...form, paymentMonth: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
            />
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">❌ {error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add Expense"}
          </button>
        </div>
      </form>
    </div>
  );
}

function thisMonthTotal(items: ExpenseItem[]): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return items
    .filter((e) => new Date(e.date) >= start)
    .reduce((s, e) => s + e.amount, 0);
}
