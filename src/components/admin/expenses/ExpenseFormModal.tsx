// src/components/admin/expenses/ExpenseFormModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EXPENSE_CATEGORIES,
  ExpenseRecord,
  normalizePaymentMonth,
} from "@/lib/expense-types";

function fmt(n: any): string {
  const num = Number(n);
  return isNaN(num)
    ? "0"
    : num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

// ✅ Normalize date input
function normalizeDate(input?: string | null): string {
  if (!input) return new Date().toISOString().slice(0, 10);
  try {
    if (/^\d{4}-\d{2}-\d{2}/.test(input)) return input.slice(0, 10);
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    }
  } catch {}
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  record?: ExpenseRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ExpenseFormModal({ record, onClose, onSaved }: Props) {
  const isEdit = !!record;

  const [date, setDate] = useState(normalizeDate(record?.date));
  const [category, setCategory] = useState(
    record?.category || EXPENSE_CATEGORIES[0].value
  );
  const [amount, setAmount] = useState(Number(record?.amount) || 0);
  const [description, setDescription] = useState(record?.description || "");
  const [employeeName, setEmployeeName] = useState(record?.employeeName || "");
  const [jobRole, setJobRole] = useState(record?.jobRole || "");
  const [paymentMonth, setPaymentMonth] = useState(
    normalizePaymentMonth(record?.paymentMonth)
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    if (!employeeName.trim()) {
      setError("Employee name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...(isEdit ? { id: record!.id } : {}),
        date,
        category,
        amount,
        description,
        employeeName,
        jobRole,
        paymentMonth,
      };

      const res = await fetch("/api/expenses", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col">
        {/* HEADER */}
        <div
          className={`text-white px-5 py-4 rounded-t-2xl flex-shrink-0 bg-gradient-to-r ${
            isEdit
              ? "from-blue-600 to-blue-700"
              : "from-red-600 to-red-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                {isEdit ? "✏️ Edit Expense" : "📉 Add Expense"}
              </h2>
              <p className="text-xs opacity-90 mt-0.5">
                {new Date(date).toLocaleDateString()}
                {isEdit && (
                  <span className="ml-2 opacity-75">
                    · ID: {record!.id.slice(0, 8)}
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white text-xl p-1 rounded-lg hover:bg-white/10 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* BODY */}
        <form
          onSubmit={submit}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {/* Basic Info */}
          <section className="bg-white rounded-xl border border-slate-200 p-3 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              📅 Basic Info
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-red-500"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Month
              </label>
              <input
                type="month"
                value={paymentMonth}
                onChange={(e) => setPaymentMonth(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-red-500"
              />
            </div>
          </section>

          {/* Employee Info */}
          <section className="bg-white rounded-xl border border-slate-200 p-3 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              👥 Employee Info
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee Name *
              </label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                required
                placeholder="e.g. Abebe Kebede"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Role
              </label>
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Cashier, Manager, Technician"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-red-500"
              />
            </div>
          </section>

          {/* Amount */}
          <section className="bg-white rounded-xl border border-slate-200 p-3 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              💵 Amount
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (ETB) *
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-lg font-bold text-red-700 focus:ring-2 focus:ring-red-500"
                placeholder="0.00"
              />
            </div>

            {amount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-red-800">
                  Total Expense
                </span>
                <span className="text-lg font-bold text-red-700">
                  − {fmt(amount)} ETB
                </span>
              </div>
            )}
          </section>

          {/* Description */}
          <section className="bg-white rounded-xl border border-slate-200 p-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              📝 Description
            </h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional notes about this expense…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-red-500"
            />
          </section>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">❌ {error}</p>
            </div>
          )}
        </form>

        {/* FOOTER */}
        <div className="bg-white border-t border-slate-200 p-3 rounded-b-2xl flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit as any}
            disabled={saving}
            className={`flex-1 py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-50 ${
              isEdit
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {saving
              ? "Saving…"
              : isEdit
              ? `Update · ${fmt(amount)} ETB`
              : `Save · ${fmt(amount)} ETB`}
          </button>
        </div>
      </div>
    </div>
  );
}
