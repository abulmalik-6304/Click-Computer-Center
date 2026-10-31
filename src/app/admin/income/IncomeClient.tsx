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
      const res = await fetch("/api/income");
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
        <IncomeForm
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

function IncomeForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    incomeSource: "maintain",
    incomeCategory: "epson-printer",
    price: 0,
    quantity: 1,
    description: "",
    usedMaterial: "",
    costPriceMain: 0,
    packSize: 0,
    usedQty: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Categories for current source
  const availableCategories = useMemo(
    () => getCategoriesForSource(form.incomeSource),
    [form.incomeSource]
  );

  // Computed values
  const totalPrice = form.price * form.quantity;
  const materialCost =
    form.packSize > 0 && form.costPriceMain > 0
      ? (form.costPriceMain / form.packSize) * form.usedQty
      : 0;
  const netIncome = totalPrice - materialCost;

  function handleSourceChange(newSource: string) {
    const cats = getCategoriesForSource(newSource);
    setForm({
      ...form,
      incomeSource: newSource,
      incomeCategory: cats[0]?.value || "",
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.price <= 0) {
      setError("Price must be greater than 0");
      return;
    }
    if (!form.incomeCategory) {
      setError("Please select a category");
      return;
    }
    setSaving(true);

    try {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">➕ Add Income</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Date */}
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

        {/* Income Source */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Income Source *
          </label>
          <select
            value={form.incomeSource}
            onChange={(e) => handleSourceChange(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          >
            {INCOME_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.icon} {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Income Category (dependent) */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Income Category *
          </label>
          <select
            value={form.incomeCategory}
            onChange={(e) =>
              setForm({ ...form, incomeCategory: e.target.value })
            }
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          >
            {availableCategories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            ⓘ Options change based on the selected source
          </p>
        </div>

        {/* Price + Quantity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">
              Price (ETB) *
            </label>
            <input
              type="number"
              value={form.price || ""}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
              required
              min={0}
              step={0.01}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={form.quantity || ""}
              onChange={(e) =>
                setForm({ ...form, quantity: Number(e.target.value) || 1 })
              }
              min={1}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
            />
          </div>
        </div>

        {/* Total preview */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Total Price:</span>
            <span className="font-bold text-emerald-700">
              {totalPrice.toLocaleString()} ETB
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Optional notes…"
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
          />
        </div>

        {/* Material Cost Section */}
        <details className="border border-slate-200 rounded-lg p-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            📦 Material Cost (optional)
          </summary>
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Material Used
              </label>
              <input
                type="text"
                value={form.usedMaterial}
                onChange={(e) =>
                  setForm({ ...form, usedMaterial: e.target.value })
                }
                placeholder="e.g. A4 paper, ink"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cost/Pack
                </label>
                <input
                  type="number"
                  value={form.costPriceMain || ""}
                  onChange={(e) =>
                    setForm({ ...form, costPriceMain: Number(e.target.value) })
                  }
                  min={0}
                  className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pack Size
                </label>
                <input
                  type="number"
                  value={form.packSize || ""}
                  onChange={(e) =>
                    setForm({ ...form, packSize: Number(e.target.value) })
                  }
                  min={0}
                  className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Used Qty
                </label>
                <input
                  type="number"
                  value={form.usedQty || ""}
                  onChange={(e) =>
                    setForm({ ...form, usedQty: Number(e.target.value) })
                  }
                  min={0}
                  className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="p-2 bg-orange-50 border border-orange-200 rounded text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Material Cost:</span>
                <span className="font-bold text-orange-700">
                  -{materialCost.toLocaleString()} ETB
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-orange-200">
                <span className="text-slate-700 font-semibold">Net Income:</span>
                <span className="font-bold text-emerald-700">
                  {netIncome.toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>
        </details>

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
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add Income"}
          </button>
        </div>
      </form>
    </div>
  );
}
