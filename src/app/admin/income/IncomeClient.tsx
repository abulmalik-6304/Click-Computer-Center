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
import { IncomeRecord } from "@/lib/income-types";
import IncomeFormModal from "@/components/admin/income/IncomeFormModal";
import IncomeDetailModal from "@/components/admin/income/IncomeDetailModal";
import IncomeSourceModal from "@/components/admin/income/IncomeSourceModal";
import ActivityLogModal from "@/components/admin/income/ActivityLogModal";
import { logActivity } from "@/lib/activity-log";
import {
  fmt,
  printHTML,
  copyToClipboard,
  shareText,
  downloadCSV,
  escapeHtml,
} from "@/lib/print-utils";

type ModalMode = "add" | null;

export default function IncomeClient({
  initialIncome,
  userRole,
  canEditIncome,
  canDeleteIncome,
  canAddIncome,
  canExportIncome,
  canViewReports,
}: {
  initialIncome: IncomeRecord[];
  userRole: string;
  canEditIncome?: boolean;
  canDeleteIncome?: boolean;
  canAddIncome?: boolean;
  canExportIncome?: boolean;
  canViewReports?: boolean;
}) {
  const [items, setItems] = useState(initialIncome);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modal, setModal] = useState<ModalMode>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // ✅ Modal / state
  const [detailRecord, setDetailRecord] = useState<IncomeRecord | null>(null);
  const [sourceModal, setSourceModal] = useState<string | null>(null);
  const [editRecord, setEditRecord] = useState<IncomeRecord | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false); // ✅ አዲስ

  // ✅ Permissions
  const canEdit = canEditIncome ?? ["owner", "manager"].includes(userRole);
  const canDelete = canDeleteIncome ?? ["owner"].includes(userRole);
  const canAdd =
    canAddIncome ??
    ["owner", "manager", "employee", "staff"].includes(userRole);
  const canExport =
    canExportIncome ?? ["owner", "manager"].includes(userRole);
  const canViewReportsFlag =
    canViewReports ?? ["owner", "manager"].includes(userRole);

  const filtered = useMemo(() => {
    let out = items;
    if (q) {
      const lq = q.toLowerCase();
      out = out.filter(
        (i) =>
          (i.description || "").toLowerCase().includes(lq) ||
          (i.recordedBy || "").toLowerCase().includes(lq) ||
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

  // ✅ Print all filtered records + log activity
  function printAllIncome() {
    // ─── Log activity ───
    logActivity("income:print", "income", {
      targetLabel: "All Income",
      details: `Printed ${filtered.length} records`,
      userRole,
    });

    const rows: string[] = [];

    filtered.forEach((r) => {
      let mats: any[] = [];
      try {
        const parsed = JSON.parse(r.materialsJson || "[]");
        if (Array.isArray(parsed) && parsed.length > 0) mats = parsed;
      } catch {}

      const baseCols = `
        <td style="font-family:monospace;font-size:10px">${escapeHtml(
          r.id.slice(0, 8)
        )}</td>
        <td>${escapeHtml(r.date.slice(0, 10))}</td>
        <td>${escapeHtml(getSourceLabel(r.incomeSource))}</td>
        <td style="text-align:right">${fmt(r.price)}</td>
        <td style="text-align:right">${r.quantity}</td>
        <td style="text-align:right;font-weight:600">${fmt(r.totalPrice)}</td>
        <td>${escapeHtml(r.incomeCategory || "—")}</td>
      `;

      const endCols = `
        <td style="text-align:right;font-weight:600">${fmt(r.netIncome)}</td>
        <td>${escapeHtml(r.description || "—")}</td>
        <td>${escapeHtml(r.recordedBy || "—")}</td>
      `;

      if (mats.length === 0) {
        rows.push(`
          <tr>
            ${baseCols}
            <td style="text-align:center;color:#94a3b8">—</td>
            <td style="text-align:right">—</td>
            <td style="text-align:right">—</td>
            <td style="text-align:right">—</td>
            <td style="text-align:right">${fmt(r.materialCost)}</td>
            ${endCols}
          </tr>
        `);
      } else {
        mats.forEach((m, idx) => {
          rows.push(`
            <tr>
              ${
                idx === 0
                  ? baseCols
                  : `<td colspan="7" style="background:#f8fafc;border:none"></td>`
              }
              <td>${escapeHtml(m.itemName || "—")}</td>
              <td style="text-align:right">${fmt(m.costPrice)}</td>
              <td style="text-align:right">${fmt(m.packSize)}</td>
              <td style="text-align:right">${fmt(m.usedQty)}</td>
              <td style="text-align:right">${fmt(m.materialCost)}</td>
              ${
                idx === 0
                  ? endCols
                  : `<td colspan="3" style="background:#f8fafc;border:none"></td>`
              }
            </tr>
          `);
        });
      }
    });

    const printedBy =
      typeof window !== "undefined"
        ? localStorage.getItem("userName") ||
          localStorage.getItem("userEmail") ||
          userRole
        : userRole;

    printHTML({
      title: "Income Report — All Records",
      bodyHtml: `
        <h2>Summary</h2>
        <div class="kpi">
          <div><div class="label">Records</div><div class="value">${
            filtered.length
          }</div></div>
          <div><div class="label">Gross</div><div class="value">${fmt(
            totals.gross
          )}</div></div>
          <div><div class="label">Material</div><div class="value">${fmt(
            totals.material
          )}</div></div>
          <div><div class="label">Net</div><div class="value">${fmt(
            totals.net
          )}</div></div>
        </div>

        <h2>All Income Records</h2>
        <table style="font-size:10px">
          <thead>
            <tr>
              <th>Income_ID</th>
              <th>Date</th>
              <th>Income_Source</th>
              <th style="text-align:right">Price</th>
              <th style="text-align:right">Quantity</th>
              <th style="text-align:right">Total_Price</th>
              <th>Income_Category</th>
              <th>Used_Material</th>
              <th style="text-align:right">Cost_Price_Main</th>
              <th style="text-align:right">Pack_Size</th>
              <th style="text-align:right">Used_Qty</th>
              <th style="text-align:right">Material_Cost</th>
              <th style="text-align:right">Net_Income</th>
              <th>Description</th>
              <th>Recorded_By</th>
            </tr>
          </thead>
          <tbody>${rows.join("")}</tbody>
          <tfoot>
            <tr>
              <td colspan="5">TOTAL (${filtered.length} records)</td>
              <td style="text-align:right">${fmt(totals.gross)}</td>
              <td colspan="5"></td>
              <td style="text-align:right">${fmt(totals.material)}</td>
              <td style="text-align:right">${fmt(totals.net)}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>

        <div class="signature">
          <div>Prepared By: <strong>${escapeHtml(printedBy)}</strong></div>
          <div>Approved By: __________________</div>
        </div>

        <p style="margin-top:24px;font-size:11px;color:#475569">
          🖨 Report printed by <strong>${escapeHtml(
            printedBy
          )}</strong> on ${new Date().toLocaleString()}
        </p>
      `,
    });
  }

  // ✅ Copy all filtered to clipboard
  async function copyAllText() {
    const lines = [
      "🧾 *CLICK COMPUTER CENTER*",
      "Income Report — All Records",
      `📅 ${new Date().toLocaleDateString()}`,
      "───────────────────────",
      `Records: ${filtered.length}`,
      `Gross: ${fmt(totals.gross)} ETB`,
      `Material: ${fmt(totals.material)} ETB`,
      `Net: ${fmt(totals.net)} ETB`,
      "───────────────────────",
      ...filtered
        .slice(0, 20)
        .map(
          (r, i) =>
            `${i + 1}. ${r.date.slice(0, 10)} · ${r.incomeSource} · ${fmt(
              r.netIncome
            )} ETB`
        ),
      filtered.length > 20 ? `… and ${filtered.length - 20} more` : "",
    ].filter(Boolean);
    const ok = await copyToClipboard(lines.join("\n"));
    if (ok) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  }

  // ✅ Export all filtered to CSV
  function exportAllCSV() {
    downloadCSV(
      `income-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Date",
        "Source",
        "Category",
        "Description",
        "Recorded By",
        "Price",
        "Qty",
        "Gross",
        "Material",
        "Net",
      ],
      filtered.map((r) => [
        r.date.slice(0, 10),
        r.incomeSource,
        r.incomeCategory,
        r.description || "",
        r.recordedBy || "",
        r.price,
        r.quantity,
        r.totalPrice,
        r.materialCost,
        r.netIncome,
      ])
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Header — ✅ Simplified buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            💰 Income
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {items.length} total · {filtered.length} filtered
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canViewReportsFlag && (
            <button
              onClick={printAllIncome}
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm text-sm"
              title="Print All Income"
            >
              🖨 Print All
            </button>
          )}
          <button
            onClick={() => setShowActivityLog(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg shadow-sm text-sm"
            title="View Activity Log"
          >
            📝 Activity Log
          </button>
          {canAdd && (
            <button
              onClick={() => setModal("add")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm text-sm"
            >
              + Add Income
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Gross Income"
          value={`${fmt(totals.gross)} ETB`}
          color="emerald"
          icon="💵"
        />
        <StatCard
          label="Material Cost"
          value={`${fmt(totals.material)} ETB`}
          color="red"
          icon="📦"
        />
        <StatCard
          label="Net Income"
          value={`${fmt(totals.net)} ETB`}
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

      {/* Source Breakdown — Clickable */}
      {breakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-3">📊 By Source</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {breakdown.map((b) => {
              const pct = totals.gross > 0 ? (b.total / totals.gross) * 100 : 0;
              return (
                <button
                  key={b.source}
                  onClick={() => setSourceModal(b.source)}
                  className="p-3 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left transition cursor-pointer"
                  title={`View ${b.sourceLabel} records`}
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
                    {fmt(b.total)} ETB
                  </p>
                  <p className="text-xs text-slate-500">
                    {b.count} transactions · Click to view →
                  </p>
                </button>
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
                    Material
                  </th>
                )}
                <th className="text-right px-3 py-3 font-semibold">Net</th>
                <th className="text-right px-3 py-3 font-semibold">Actions</th>
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
                filtered.map((i) => {
                  const isExpanded = expanded === i.id;
                  const hasMaterials =
                    i.materialsJson && i.materialsJson.length > 2;

                  return (
                    <>
                      <tr
                        key={i.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-3 py-3 text-slate-600">
                          {i.date.slice(0, 10)}
                        </td>
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
                        <td className="px-3 py-3 text-slate-600 hidden lg:table-cell truncate max-w-xs">
                          {i.description || "—"}
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-emerald-600">
                          +{fmt(i.grossIncome)}
                        </td>
                        {canEdit && (
                          <td className="px-3 py-3 text-right text-slate-600 hidden md:table-cell">
                            {i.materialCost > 0
                              ? `-${fmt(i.materialCost)}`
                              : "—"}
                          </td>
                        )}
                        <td
                          className={`px-3 py-3 text-right font-bold ${
                            i.netIncome >= 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {fmt(i.netIncome)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setDetailRecord(i)}
                              className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                              title="View Detail"
                            >
                              👁
                            </button>
                            {hasMaterials && (
                              <button
                                onClick={() =>
                                  setExpanded(isExpanded ? null : i.id)
                                }
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                title="View Materials"
                              >
                                {isExpanded ? "▲" : "📦"}
                              </button>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => setEditRecord(i)}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                title="Edit"
                              >
                                ✏️
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={async () => {
                                  if (
                                    !confirm("Delete this income record?")
                                  )
                                    return;
                                  await fetch("/api/income", {
                                    method: "DELETE",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({ id: i.id }),
                                  });
                                  // ✅ Log delete
                                  logActivity("income:delete", "income", {
                                    targetId: i.id,
                                    targetLabel: i.incomeSource,
                                    details: "Income record deleted",
                                    userRole,
                                  });
                                  refresh();
                                }}
                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                title="Delete"
                              >
                                🗑
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {isExpanded && hasMaterials && (
                        <tr className="bg-slate-50">
                          <td
                            colSpan={canEdit ? 8 : 6}
                            className="px-6 py-3"
                          >
                            <div className="text-xs">
                              <p className="font-semibold text-slate-700 mb-2">
                                📦 Materials Used:
                              </p>
                              <div className="space-y-1">
                                {(() => {
                                  try {
                                    const mats = JSON.parse(
                                      i.materialsJson || "[]"
                                    );
                                    return mats.map(
                                      (m: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="flex justify-between items-center py-1 border-b border-slate-200"
                                        >
                                          <span className="text-slate-700">
                                            {m.itemName} · {m.usedQty} used
                                          </span>
                                          <span className="font-semibold text-red-600">
                                            − {fmt(m.materialCost)} ETB
                                          </span>
                                        </div>
                                      )
                                    );
                                  } catch {
                                    return <p>Unable to parse materials</p>;
                                  }
                                })()}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Income Modal — ✅ with log */}
      {modal === "add" && (
        <IncomeFormModal
          onClose={() => setModal(null)}
          onSaved={() => {
            logActivity("income:create", "income", {
              targetLabel: "New income",
              details: "Income record added",
              userRole,
            });
            setModal(null);
            refresh();
          }}
        />
      )}

      {/* Detail Modal */}
      {detailRecord && (
        <IncomeDetailModal
          record={detailRecord}
          allRecords={items}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={() => {
            setEditRecord(detailRecord);
            setDetailRecord(null);
          }}
          onDelete={async () => {
            if (!confirm("Delete this income record?")) return;
            await fetch("/api/income", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: detailRecord.id }),
            });
            logActivity("income:delete", "income", {
              targetId: detailRecord.id,
              targetLabel: detailRecord.incomeSource,
              details: "Income record deleted",
              userRole,
            });
            setDetailRecord(null);
            refresh();
          }}
          onClose={() => setDetailRecord(null)}
        />
      )}

      {/* Source Modal */}
      {sourceModal && (
        <IncomeSourceModal
          source={sourceModal}
          records={items.filter(
            (r) =>
              r.incomeSource.toLowerCase() === sourceModal.toLowerCase()
          )}
          canEdit={canEdit}
          canDelete={canDelete}
          onClose={() => setSourceModal(null)}
          onEditRecord={(r) => {
            setSourceModal(null);
            setEditRecord(r);
          }}
          onDeleteRecord={async (r) => {
            if (!confirm(`Delete income record ${r.id}?`)) return;
            await fetch("/api/income", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: r.id }),
            });
            logActivity("income:delete", "income", {
              targetId: r.id,
              targetLabel: r.incomeSource,
              details: "Income record deleted",
              userRole,
            });
            setSourceModal(null);
            refresh();
          }}
        />
      )}

      {/* Edit Income Modal — ✅ with log */}
      {editRecord && (
        <IncomeFormModal
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSaved={() => {
            logActivity("income:update", "income", {
              targetId: editRecord.id,
              targetLabel: editRecord.incomeSource,
              details: "Income record updated",
              userRole,
            });
            setEditRecord(null);
            refresh();
          }}
        />
      )}

      {/* ✅ Activity Log Modal */}
      {showActivityLog && (
        <ActivityLogModal onClose={() => setShowActivityLog(false)} />
      )}
    </div>
  );
}

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
      emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
      red: "text-red-700 bg-red-50 border-red-200",
      slate: "text-slate-700 bg-slate-50 border-slate-200",
      orange: "text-orange-700 bg-orange-50 border-orange-200",
    }[color] ?? "text-slate-700 bg-slate-50 border-slate-200";

  return (
    <div className={`${cls} p-4 rounded-2xl border`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium opacity-75">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
