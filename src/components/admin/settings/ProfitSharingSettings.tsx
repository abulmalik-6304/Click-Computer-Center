// src/components/admin/settings/ProfitSharingSettings.tsx
"use client";

import { useEffect, useState } from "react";

interface ProfitConfig {
  sharedExpenseCategories: string[];
  sharedDivisor: number;
  staffSharePercent: number;
  additionalStaff: { email: string; name: string; percent: number }[];
}

const ALL_EXPENSE_CATEGORIES = [
  "ትራንስፖርት",
  "የማህበራዊ ወጪ",
  "የቤት ወጪ",
  "ደመወዝ",
  "የኢንተርኔት ወጭ",
  "የድርጅቱ ወጪ",
  "ሌላ",
];

const DEFAULT_CONFIG: ProfitConfig = {
  sharedExpenseCategories: ["የቤት ወጪ"],
  sharedDivisor: 3,
  staffSharePercent: 50,
  additionalStaff: [],
};

export default function ProfitSharingSettings() {
  const [config, setConfig] = useState<ProfitConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/settings/profit-sharing");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      if (data.config) setConfig(data.config);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/settings/profit-sharing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setSuccess("✅ Profit sharing settings saved!");
      setTimeout(() => setSuccess(""), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function toggleCategory(cat: string) {
    setConfig({
      ...config,
      sharedExpenseCategories: config.sharedExpenseCategories.includes(cat)
        ? config.sharedExpenseCategories.filter((c) => c !== cat)
        : [...config.sharedExpenseCategories, cat],
    });
  }

  function addStaff() {
    setConfig({
      ...config,
      additionalStaff: [
        ...config.additionalStaff,
        { email: "", name: "", percent: 0 },
      ],
    });
  }

  function updateStaff(idx: number, field: keyof (typeof config.additionalStaff)[0], value: any) {
    setConfig({
      ...config,
      additionalStaff: config.additionalStaff.map((s, i) =>
        i === idx ? { ...s, [field]: value } : s
      ),
    });
  }

  function removeStaff(idx: number) {
    setConfig({
      ...config,
      additionalStaff: config.additionalStaff.filter((_, i) => i !== idx),
    });
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="mt-3 text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  const totalAdditionalPercent = config.additionalStaff.reduce(
    (s, st) => s + st.percent,
    0
  );
  const remainingStaffPercent = config.staffSharePercent - totalAdditionalPercent;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-slate-900">💵 Profit Sharing Settings</h3>
        <p className="text-sm text-slate-500 mt-1">
          Configure how monthly profit is split between owner and staff
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border-b border-emerald-200">
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      <div className="p-5 space-y-5">
        {/* 1. Shared Expense Categories */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            🏠 Shared Expense Categories
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Which expense categories count as "staff-shared" (divided by divisor)?
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  config.sharedExpenseCategories.includes(cat)
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                }`}
              >
                {config.sharedExpenseCategories.includes(cat) ? "✓ " : ""}
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Divisor */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            ➗ Shared Expense Divisor
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Divide shared expenses by this number before splitting
          </p>
          <input
            type="number"
            min={1}
            value={config.sharedDivisor}
            onChange={(e) =>
              setConfig({ ...config, sharedDivisor: Number(e.target.value) })
            }
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        {/* 3. Staff Share % */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            📊 Staff Profit Share (%)
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Percentage of net profit going to managers/staff (owner gets the rest)
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={config.staffSharePercent}
              onChange={(e) =>
                setConfig({
                  ...config,
                  staffSharePercent: Number(e.target.value),
                })
              }
              className="flex-1"
            />
            <span className="text-sm font-bold text-orange-600 w-12">
              {config.staffSharePercent}%
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>👑 Owner: {100 - config.staffSharePercent}%</span>
            <span>📊 Staff: {config.staffSharePercent}%</span>
          </div>
        </div>

        {/* 4. Additional Staff */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="block text-sm font-semibold text-slate-900">
                👥 Additional Staff Shares
              </label>
              <p className="text-xs text-slate-500">
                Assign specific % to additional staff from the staff share
              </p>
            </div>
            <button
              onClick={addStaff}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg"
            >
              + Add Staff
            </button>
          </div>

          {config.additionalStaff.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center border-2 border-dashed border-slate-200 rounded-lg">
              No additional staff — all staff share goes to manager
            </p>
          ) : (
            <div className="space-y-2">
              {config.additionalStaff.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                >
                  <input
                    type="text"
                    placeholder="Name"
                    value={s.name}
                    onChange={(e) => updateStaff(idx, "name", e.target.value)}
                    className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs text-slate-900"
                  />
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={s.email}
                    onChange={(e) => updateStaff(idx, "email", e.target.value)}
                    className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs text-slate-900"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={s.percent}
                    onChange={(e) =>
                      updateStaff(idx, "percent", Number(e.target.value))
                    }
                    className="w-16 rounded border border-slate-300 px-2 py-1 text-xs text-slate-900"
                  />
                  <span className="text-xs text-slate-500">%</span>
                  <button
                    onClick={() => removeStaff(idx)}
                    className="text-red-500 hover:text-red-700 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <div className="text-xs text-slate-600 pt-2 border-t border-slate-200">
                Total additional: <strong>{totalAdditionalPercent}%</strong>
                {" · "}
                Manager remaining:{" "}
                <strong className={remainingStaffPercent < 0 ? "text-red-600" : "text-emerald-600"}>
                  {remainingStaffPercent}%
                </strong>
              </div>
              {remainingStaffPercent < 0 && (
                <p className="text-xs text-red-600">
                  ⚠️ Additional staff shares exceed total staff share (
                  {config.staffSharePercent}%)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving || totalAdditionalPercent > config.staffSharePercent}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving…" : "💾 Save Settings"}
        </button>
      </div>
    </div>
  );
}
