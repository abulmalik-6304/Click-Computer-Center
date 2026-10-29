// src/app/admin/export/ExportClient.tsx
"use client";

import { useMemo, useState } from "react";
import {
  ExportKind, ExportFormat, ExportPayload,
  EXPORT_COLUMNS,
  normalizeSalesRows, normalizeInventoryRows,
  normalizeExpenseRows, normalizeStaffRows,
} from "@/lib/export-utils";

const KIND_LABELS: Record<ExportKind, string> = {
  sales: "🧾 Sales",
  inventory: "📦 Inventory",
  expenses: "📉 Expenses",
  staff: "👥 Staff",
};

const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: "📄 PDF",
  xlsx: "📊 Excel",
  csv: "📋 CSV",
};

const RANGE_LABELS = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  year: "This Year",
  all: "All Time",
} as const;

type RangeKey = keyof typeof RANGE_LABELS;

export default function ExportClient({
  sales, inventory, expenses, users, employees,
}: {
  sales: any[];
  inventory: any[];
  expenses: any[];
  users: any[];
  employees: any[];
}) {
  const [kind, setKind] = useState<ExportKind>("sales");
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [range, setRange] = useState<RangeKey>("30d");
  const [busy, setBusy] = useState(false);

  const { from, to } = useMemo(() => computeRange(range), [range]);

  // ─── Prepare rows for the selected kind ───
  const preparedRows = useMemo(() => {
    if (kind === "sales") {
      const all = normalizeSalesRows(sales);
      if (range !== "all") {
        return all.filter((r) => inRange(r.Date, from, to));
      }
      return all;
    }
    if (kind === "inventory") return normalizeInventoryRows(inventory);
    if (kind === "expenses") {
      const all = normalizeExpenseRows(expenses);
      if (range !== "all") return all.filter((r) => inRange(r.Date, from, to));
      return all;
    }
    return normalizeStaffRows(users, employees);
  }, [kind, range, sales, inventory, expenses, users, employees, from, to]);

  const columns = EXPORT_COLUMNS[kind];

  // Preview: first 8 rows
  const previewRows = preparedRows.slice(0, 8);

  // ─── Totals for sales ───
  const totals =
    kind === "sales"
      ? preparedRows.reduce(
          (acc: any, r: any) => ({
            revenue: acc.revenue + (Number(r.Revenue) || 0),
            cost: acc.cost + (Number(r.Cost) || 0),
            profit: acc.profit + (Number(r.Profit) || 0),
          }),
          { revenue: 0, cost: 0, profit: 0 }
        )
      : null;

  const rangeLabel =
    kind === "sales" || kind === "expenses"
      ? `${RANGE_LABELS[range]} — ${from.toLocaleDateString()} to ${to.toLocaleDateString()}`
      : undefined;

  async function handleExport() {
    if (preparedRows.length === 0) {
      alert("No rows to export for this selection.");
      return;
    }
    setBusy(true);

    try {
      const payload: ExportPayload = {
        kind,
        format,
        title: `${KIND_LABELS[kind].replace(/[^\w\s]/g, "").trim()} Report`,
        columns,
        rows: preparedRows,
        generatedAt: new Date().toISOString(),
        rangeLabel,
      };

      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Export failed" }));
        alert(`Export failed: ${err.error}`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const filename = `${kind}-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 print:p-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 print:hidden">
          📤 Export Center
        </h1>
        <p className="text-sm text-slate-500 mt-1 print:hidden">
          Download professional reports in PDF, Excel, or CSV
        </p>
      </div>

      {/* Kind selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 print:hidden">
        <label className="block text-sm font-semibold text-slate-900 mb-2">
          Data Source
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {(Object.keys(KIND_LABELS) as ExportKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`px-4 py-3 rounded-lg text-sm font-semibold transition ${
                kind === k
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {KIND_LABELS[k]}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="grid sm:grid-cols-2 gap-4 print:hidden">
        {(kind === "sales" || kind === "expenses") && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Date Range
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(RANGE_LABELS) as RangeKey[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    range === r
                      ? "bg-orange-500 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Format */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            File Format
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  format === f
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900">
              {KIND_LABELS[kind]} — {preparedRows.length} rows
            </h2>
            {rangeLabel && (
              <p className="text-sm text-slate-500 mt-1">{rangeLabel}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm"
            >
              🖨 Print
            </button>
            <button
              onClick={handleExport}
              disabled={busy || preparedRows.length === 0}
              className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm disabled:opacity-50"
            >
              {busy ? "Exporting…" : `⬇ Download ${format.toUpperCase()}`}
            </button>
          </div>
        </div>

        {totals && (
          <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
            <Mini label="Revenue" value={totals.revenue} color="emerald" />
            <Mini label="Cost" value={totals.cost} color="slate" />
            <Mini
              label="Profit"
              value={totals.profit}
              color={totals.profit >= 0 ? "emerald" : "red"}
            />
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 print:hidden">
          <h3 className="font-bold text-slate-900 text-sm">Preview (first 8 rows)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-3 py-2.5 font-semibold text-slate-700 text-${
                      c.align ?? "left"
                    } whitespace-nowrap`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-8 text-center text-slate-400 text-sm"
                  >
                    No rows to preview
                  </td>
                </tr>
              ) : (
                previewRows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`px-3 py-2 text-slate-700 text-${c.align ?? "left"} whitespace-nowrap`}
                      >
                        {formatCell((r as Record<string, any>)[c.key], c.key)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {preparedRows.length > 8 && (
          <p className="px-4 py-2 text-xs text-slate-500 border-t border-slate-100 print:hidden">
            … and {preparedRows.length - 8} more rows in the file
          </p>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 print:hidden">
        📤 Generated by Click Computer Center · financial numbers come straight from the engine
      </p>
    </div>
  );
}

// ─── Components ───

function Mini({
  label, value, color,
}: { label: string; value: number; color: "emerald" | "slate" | "red" }) {
  const cls =
    color === "emerald"
      ? "text-emerald-600"
      : color === "red"
      ? "text-red-600"
      : "text-slate-900";
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${cls}`}>
        {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
      </p>
    </div>
  );
}

// ─── Helpers ───

function computeRange(key: RangeKey): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let from: Date;
  switch (key) {
    case "today":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "7d":
      from = new Date(now); from.setDate(now.getDate() - 6); from.setHours(0, 0, 0, 0); break;
    case "30d":
      from = new Date(now); from.setDate(now.getDate() - 29); from.setHours(0, 0, 0, 0); break;
    case "90d":
      from = new Date(now); from.setDate(now.getDate() - 89); from.setHours(0, 0, 0, 0); break;
    case "year":
      from = new Date(now.getFullYear(), 0, 1); break;
    case "all":
    default:
      from = new Date(2020, 0, 1); break;
  }
  return { from, to };
}

function inRange(dateStr: string, from: Date, to: Date): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d >= from && d <= to;
}

function formatCell(raw: any, key: string): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "number") {
    if (key.toLowerCase().includes("margin")) return raw.toFixed(2) + "%";
    return raw.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(raw);
}
