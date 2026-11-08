// src/components/admin/income/IncomeClient.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IncomeRecord } from "@/lib/income-types";
import IncomeDetailModal from "./IncomeDetailModal";

function fmt(n: any): string {
  const num = Number(n);
  return isNaN(num)
    ? "0"
    : num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

interface Props {
  initialIncome: IncomeRecord[];
  userRole: string;
  canEditIncome: boolean;
  canDeleteIncome: boolean;
}

type SortKey = "date" | "totalPrice" | "netIncome" | "incomeCategory";

export default function IncomeClient({
  initialIncome,
  userRole,
  canEditIncome,
  canDeleteIncome,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State
  const [records, setRecords] = useState<IncomeRecord[]>(initialIncome);
  const [selected, setSelected] = useState<IncomeRecord | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [deleting, setDeleting] = useState<string | null>(null);

  // Derived filter options
  const categories = useMemo(
    () =>
      Array.from(new Set(records.map((r) => r.incomeCategory))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [records]
  );
  const sources = useMemo(
    () =>
      Array.from(new Set(records.map((r) => r.incomeSource))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [records]
  );

  // Filtered + sorted records
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = records.filter((r) => {
      const matchSearch =
        !q ||
        r.incomeSource.toLowerCase().includes(q) ||
        r.incomeCategory.toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q) ||
        (r.recordedBy || "").toLowerCase().includes(q);
      const matchCategory =
        categoryFilter === "all" || r.incomeCategory === categoryFilter;
      const matchSource =
        sourceFilter === "all" || r.incomeSource === sourceFilter;
      return matchSearch && matchCategory && matchSource;
    });

    list = [...list].sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [records, search, categoryFilter, sourceFilter, sortKey, sortDir]);

  // Totals
  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        acc.gross += Number(r.totalPrice) || 0;
        acc.material += Number(r.materialCost) || 0;
        acc.net += Number(r.netIncome) || 0;
        return acc;
      },
      { gross: 0, material: 0, net: 0 }
    );
  }, [filtered]);

  // Handlers
  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  async function handleDelete() {
    if (!selected) return;
    if (!confirm(`Delete income record "${selected.incomeSource}"? This cannot be undone.`))
      return;
    try {
      setDeleting(selected.id);
      const res = await fetch(`/api/admin/income/${selected.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setRecords((prev) => prev.filter((r) => r.id !== selected.id));
      setSelected(null);
      startTransition(() => router.refresh());
    } catch (err) {
      alert("Delete failed. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  function handleEdit() {
    if (!selected) return;
    // Redirect to edit page or open edit form — adjust to your routing
    router.push(`/admin/income/${selected.id}/edit`);
  }

  function handleRefresh() {
    startTransition(() => router.refresh());
  }

  function exportCSV() {
    const headers = [
      "Date",
      "Source",
      "Category",
      "Price",
      "Qty",
      "Total",
      "Material",
      "Net",
      "Recorded By",
      "Description",
    ];
    const rows = filtered.map((r) => [
      r.date.slice(0, 10),
      r.incomeSource,
      r.incomeCategory,
      r.price,
      r.quantity,
      r.totalPrice,
      r.materialCost,
      r.netIncome,
      r.recordedBy || "",
      (r.description || "").replace(/\n/g, " "),
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `income-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- Render ----------
  return (
    <div className="space-y-4">
      {/* Header + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">💰 Income</h1>
          <p className="text-sm text-slate-500">
            {filtered.length} of {records.length} records · role:{" "}
            <span className="font-semibold">{userRole}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
            title="Export CSV"
          >
            📥 Export CSV
          </button>
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="px-3 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg"
            title="Refresh"
          >
            {isPending ? "⏳" : "🔄"} Refresh
          </button>
          {canEditIncome && (
            <a
              href="/admin/income/new"
              className="px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
            >
              ➕ New Income
            </a>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Records" value={String(filtered.length)} color="slate" />
        <Kpi label="Gross (ETB)" value={fmt(totals.gross)} color="emerald" />
        <Kpi label="Material (ETB)" value={fmt(totals.material)} color="red" />
        <Kpi
          label="Net (ETB)"
          value={fmt(totals.net)}
          color={totals.net >= 0 ? "emerald" : "red"}
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="🔍 Search source, category, description, recorder..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
          >
            <option value="all">All Sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {(search || categoryFilter !== "all" || sourceFilter !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setCategoryFilter("all");
              setSourceFilter("all");
            }}
            className="text-xs text-emerald-600 hover:underline"
          >
            ✕ Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <Th onClick={() => toggleSort("date")} active={sortKey === "date"} dir={sortDir}>
                  Date
                </Th>
                <Th>Source</Th>
                <Th
                  onClick={() => toggleSort("incomeCategory")}
                  active={sortKey === "incomeCategory"}
                  dir={sortDir}
                >
                  Category
                </Th>
                <Th align="right">Price × Qty</Th>
                <Th
                  onClick={() => toggleSort("totalPrice")}
                  active={sortKey === "totalPrice"}
                  dir={sortDir}
                  align="right"
                >
                  Total
                </Th>
                <Th align="right">Material</Th>
                <Th
                  onClick={() => toggleSort("netIncome")}
                  active={sortKey === "netIncome"}
                  dir={sortDir}
                  align="right"
                >
                  Net
                </Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center text-slate-400">
                    No income records found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelected(r)}
                  >
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {r.date.slice(0, 10)}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {r.incomeSource}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{r.incomeCategory}</td>
                    <td className="px-3 py-2 text-right text-slate-600 whitespace-nowrap">
                      {fmt(r.price)} × {r.quantity}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900">
                      {fmt(r.totalPrice)}
                    </td>
                    <td className="px-3 py-2 text-right text-red-600">
                      −{fmt(r.materialCost)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-bold ${
                        r.netIncome >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {fmt(r.netIncome)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(r);
                        }}
                        className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-emerald-50 border-t-2 border-emerald-200">
                <tr className="font-bold">
                  <td colSpan={4} className="px-3 py-2 text-slate-900">
                    TOTAL ({filtered.length})
                  </td>
                  <td className="px-3 py-2 text-right text-emerald-700">
                    {fmt(totals.gross)}
                  </td>
                  <td className="px-3 py-2 text-right text-red-600">
                    −{fmt(totals.material)}
                  </td>
                  <td className="px-3 py-2 text-right text-emerald-700">
                    {fmt(totals.net)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <IncomeDetailModal
          record={selected}
          allRecords={records}
          canEdit={canEditIncome}
          canDelete={canDeleteIncome}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Deleting overlay */}
      {deleting && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl px-6 py-4 shadow-xl text-sm font-semibold">
            Deleting...
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Sub-components ----------
function Kpi({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "slate" | "emerald" | "red";
}) {
  const colorMap = {
    slate: "bg-slate-50 border-slate-200 text-slate-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };
  return (
    <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
      <p className="text-[10px] uppercase tracking-wide opacity-70 font-semibold">
        {label}
      </p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}

function Th({
  children,
  onClick,
  active,
  dir,
  align = "left",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  dir?: "asc" | "desc";
  align?: "left" | "right";
}) {
  return (
    <th
      onClick={onClick}
      className={`px-3 py-2 text-xs font-bold text-slate-700 ${
        align === "right" ? "text-right" : "text-left"
      } ${onClick ? "cursor-pointer select-none hover:bg-slate-200" : ""}`}
    >
      {children}
      {active && <span className="ml-1">{dir === "asc" ? "▲" : "▼"}</span>}
    </th>
  );
}
