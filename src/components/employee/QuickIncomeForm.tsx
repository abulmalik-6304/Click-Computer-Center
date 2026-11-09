// src/components/employee/QuickIncomeForm.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  INCOME_SOURCES,
  getCategoriesForSource,
} from "@/lib/income-categories";

function fmt(n: any): string {
  const num = Number(n);
  return isNaN(num)
    ? "0"
    : num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

export default function QuickIncomeForm() {
  const router = useRouter();

  const [incomeSource, setIncomeSource] = useState("maintain");
  const [incomeCategory, setIncomeCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const availableCategories = useMemo(
    () => getCategoriesForSource(incomeSource),
    [incomeSource]
  );

  // Set default category when source changes
  useMemo(() => {
    if (availableCategories.length > 0 && !incomeCategory) {
      setIncomeCategory(availableCategories[0].value);
    }
  }, [availableCategories, incomeCategory]);

  const total = price * quantity;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (price <= 0) {
      setError("❌ Price must be greater than 0");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          incomeSource,
          incomeCategory,
          price,
          quantity,
          description,
          materials: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "❌ ገቢ መመዝገብ አልተቻለም");
        setSaving(false);
        return;
      }

      setSuccess("✅ ገቢ ተመዝግቧል!");

      // Reset
      setPrice(0);
      setQuantity(1);
      setDescription("");

      setTimeout(() => {
        router.push("/employee/dashboard");
        router.refresh();
      }, 1500);
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
    >
      {/* Date */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-1">
          📅 Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>

      {/* Source */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-1">
          📂 Income Source *
        </label>
        <select
          value={incomeSource}
          onChange={(e) => {
            const newSource = e.target.value;
            setIncomeSource(newSource);
            const cats = getCategoriesForSource(newSource);
            setIncomeCategory(cats[0]?.value || "");
          }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        >
          {INCOME_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.icon} {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-1">
          🏷 Category *
        </label>
        <select
          value={incomeCategory}
          onChange={(e) => setIncomeCategory(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        >
          {availableCategories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Price × Qty */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            💵 Price (ETB) *
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={price || ""}
            onChange={(e) => setPrice(Number(e.target.value) || 0)}
            required
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            🔢 Quantity
          </label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Total */}
      {total > 0 && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
          <span className="text-sm font-semibold text-emerald-800">
            💎 Total
          </span>
          <span className="text-lg font-bold text-emerald-700">
            {fmt(total)} ETB
          </span>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-1">
          📝 Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Optional notes…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={saving || price <= 0}
        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-50"
      >
        {saving ? "⏳ Saving…" : `✅ Save Income · ${fmt(total)} ETB`}
      </button>
    </form>
  );
}
