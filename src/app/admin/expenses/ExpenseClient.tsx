// src/app/admin/expenses/ExpenseClient.tsx
"use client";

import { useMemo, useState } from "react";
import {
  EXPENSE_CATEGORIES,
  getCategoryIcon,
  getCategoryLabel,
  getCategoryColor,
  formatPaymentMonth,
  ExpenseRecord,
} from "@/lib/expense-types";
import ExpenseFormModal from "@/components/admin/expenses/ExpenseFormModal";
import ExpenseDetailModal from "@/components/admin/expenses/ExpenseDetailModal";
import ExpenseCategoryModal from "@/components/admin/expenses/ExpenseCategoryModal";
import ActivityLogModal from "@/components/admin/income/ActivityLogModal";
import { logActivity } from "@/lib/activity-log";
import { fmt, printHTML, escapeHtml } from "@/lib/print-utils";

interface Props {
  initialExpenses: ExpenseRecord[];
  userRole: string;
  canAddExpense?: boolean;
  canEditExpense?: boolean;
  canDeleteExpense?: boolean;
  canExportExpense?: boolean;
  canPrintExpense?: boolean;
  canViewActivityLog?: boolean;
}

export default function ExpenseClient({
  initialExpenses,
  userRole,
  canAddExpense,
  canEditExpense,
  canDeleteExpense,
  canExportExpense,
  canPrintExpense,
  canViewActivityLog,
}: Props) {
  const [items, setItems] = useState<ExpenseRecord[]>(initialExpenses);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [showAdd, setShowAdd] = useState(false);
  const [editRecord, setEditRecord] = useState<ExpenseRecord | null>(null);
  const [detailRecord, setDetailRecord] = useState<ExpenseRecord | null>(null);
  const [categoryModal, setCategoryModal] = useState<string | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(false);

  // ✅ Permissions (no fallback)
  const canAdd = canAddExpense === true;
  const canEdit = canEditExpense === true;
  const canDelete = canDeleteExpense === true;
  const canExport = canExportExpense === true;
  const canPrint = canPrintExpense === true;
  const canSeeActivityLog = canViewActivityLog === true;
  const canDeleteActivityLog = userRole === "owner";

  // ─── Filtered ───
  const filtered = useMemo(() => {
    let out = items;
    if (q) {
      const lq = q.toLowerCase();
      out = out.filter(
        (i) =>
          (i.description || "").toLowerCase().includes(lq) ||
          (i.recordedBy || "").toLowerCase().includes(lq) ||
          (i.employeeName || "").toLowerCase().includes(lq) ||
          (i.jobRole || "").toLowerCase().includes(lq) ||
          i.category.toLowerCase().includes(lq)
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
    if (categoryFilter !== "all") {
      out = out.filter(
        (i) => i.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    return out;
  }, [items, q, from, to, categoryFilter]);

  // ─── Totals ───
  const totals = useMemo(
    () => ({
      total: filtered.reduce((s, i) => s + (Number(i.amount) || 0), 0),
      count: filtered.length,
    }),
    [filtered]
  );

  // ─── By Category ───
  const byCategory = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const i of filtered) {
      const key = i.category.toLowerCase();
      const ex = map.get(key) || { total: 0, count: 0 };
      ex.total += Number(i.amount) || 0;
      ex.count += 1;
      map.set(key, ex);
    }
    const grand = Array.from(map.values()).reduce((s, x) => s + x.total, 0);
    return Array.from(map.entries()).map(([cat, d]) => ({
      category: cat,
      label: getCategoryLabel(cat),
      icon: getCategoryIcon(cat),
      color: getCategoryColor(cat),
      total: d.total,
      count: d.count,
      pct: grand > 0 ? (d.total / grand) * 100 : 0,
    }));
  }, [filtered]);

  // ─── Refresh ───
  async function refresh() {
    try {
      const res = await fetch("/api/expenses", { cache: "no-store" });
      const data = await res.json();
      const list = data.expenses || data.items || [];
      if (Array.isArray(list)) setItems(list);
    } catch (e) {
      console.error("Refresh failed:", e);
    }
  }

  // ─── Print All ───
  function printAll() {
    logActivity("expense:print", "expense", {
      targetLabel: "All Expenses",
      details: `Printed ${filtered.length} records`,
      userRole,
    });

    const rows = filtered
      .map(
        (r) => `
        <tr>
          <td style="font-family:monospace;font-size:10px">${escapeHtml(
            r.id.slice(0, 10)
          )}</td>
          <td>${escapeHtml(r.date.slice(0, 10))}</td>
          <td>${escapeHtml(getCategoryLabel(r.category))}</td>
          <td>${escapeHtml(r.employeeName || "—")}</td>
          <td>${escapeHtml(r.jobRole || "—")}</td>
          <td>${escapeHtml(formatPaymentMonth(r.paymentMonth))}</td>
          <td>${escapeHtml(r.description || "—")}</td>
          <td style="text-align:right;font-weight:600">${fmt(r.amount)}</td>
          <td>${escapeHtml(r.recordedBy || "—")}</td>
        </tr>`
      )
      .join("");

    const printedBy =
      typeof window !== "undefined"
        ? localStorage.getItem("userName") ||
          localStorage.getItem("userEmail") ||
          userRole
        : userRole;

    printHTML({
      title: "Expense Report — All Records",
      bodyHtml: `
        <h2>Summary</h2>
        <div class="kpi">
          <div><div class="label">Records</div><div class="value">${
            filtered.length
          }</div></div>
          <div><div class="label">Total</div><div class="value">${fmt(
            totals.total
          )}</div></div>
        </div>
        <h2>All Expense Records</h2>
        <table style="font-size:10px">
          <thead>
            <tr>
              <th>Expense_ID</th><th>Date</th><th>Category</th>
              <th>Employee</th><th>Job Role</th><th>Payment_Month</th>
              <th>Description</th>
              <th style="text-align:right">Amount</th>
              <th>Recorded_By</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="7">TOTAL (${filtered.length} records)</td>
              <td style="text-align:right">${fmt(totals.total)}</td>
              <td></td>
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

  // ─── Delete ───
  async function handleDelete(record: ExpenseRecord, fromModal = false) {
    if (!confirm(`Delete expense "${record.id}"?`)) return;
    try {
      await fetch("/api/expenses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id }),
      });
      logActivity("expense:delete", "expense", {
        targetId: record.id,
        targetLabel: getCategoryLabel(record.category),
        details: "Expense record deleted",
        userRole,
      });
      if (fromModal) setDetailRecord(null);
      if (fromModal) setCategoryModal(null);
      await refresh();
    } catch (e: any) {
      alert("Delete failed: " + e.message);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            📉 Expenses
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {items.length} total · {filtered.length} filtered
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canPrint && (
            <button
              onClick={printAll}
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm text-sm"
            >
              🖨 Print All
            </button>
          )}
          {canSeeActivityLog && (
            <button
              onClick={() => setShowActivityLog(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg shadow-sm text-sm"
            >
              📝 Activity Log
            </button>
          )}
          {canAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm text-sm"
            >
              + Add Expense
            </button>
          )}
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Expenses"
          value={`${fmt(totals.total)} ETB`}
          color="red"
          icon="💸"
        />
        <StatCard
          label="Transactions"
          value={totals.count}
          color="slate"
          icon="🧾"
        />
        <StatCard
          label="Categories"
          value={byCategory.length}
          color="orange"
          icon="📊"
        />
        <StatCard
          label="Avg / Transaction"
          value={`${fmt(
            totals.count > 0 ? totals.total / totals.count : 0
          )} ETB`}
          color="slate"
          icon="📈"
        />
      </div>

      {/* ─── By Category — Clickable ─── */}
      {byCategory.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-3">💼 By Category</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {byCategory.map((b) => (
              <button
                key={b.category}
                onClick={() => setCategoryModal(b.category)}
                className="p-3 rounded-lg bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-300 text-left transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {b.icon} {b.label}
                  </span>
                  <span className="text-xs text-slate-500">
                    {b.pct.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${Math.min(b.pct, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {fmt(b.total)} ETB
                </p>
                <p className="text-xs text-slate-500">
                  {b.count} transactions · Click to view →
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Filters ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="🔍 Search employee, description…"
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900"
          />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900"
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

      {/* ─── Table ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-3 py-3 font-semibold">Date</th>
                <th className="text-left px-3 py-3 font-semibold">Category</th>
                <th className="text-left px-3 py-3 font-semibold hidden md:table-cell">
                  Employee
                </th>
                <th className="text-left px-3 py-3 font-semibold hidden lg:table-cell">
                  Job Role
                </th>
                <th className="text-left px-3 py-3 font-semibold hidden lg:table-cell">
                  Payment Month
                </th>
                <th className="text-left px-3 py-3 font-semibold hidden xl:table-cell">
                  Description
                </th>
                <th className="text-right px-3 py-3 font-semibold">Amount</th>
                <th className="text-right px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    No expense records found
                  </td>
                </tr>
              ) : (
                filtered.map((i) => (
                  <tr
                    key={i.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-3 py-3 text-slate-600">
                      {i.date.slice(0, 10)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                          i.category
                        )}`}
                      >
                        {getCategoryIcon(i.category)}{" "}
                        {getCategoryLabel(i.category)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-700 hidden md:table-cell">
                      {i.employeeName || "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-600 hidden lg:table-cell">
                      {i.jobRole || "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-600 hidden lg:table-cell">
                      {formatPaymentMonth(i.paymentMonth)}
                    </td>
                    <td className="px-3 py-3 text-slate-600 hidden xl:table-cell truncate max-w-xs">
                      {i.description || "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-red-600">
                      −{fmt(i.amount)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setDetailRecord(i)}
                          className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                          title="View"
                        >
                          👁
                        </button>
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
                            onClick={() => handleDelete(i)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            title="Delete"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Add Modal ─── */}
      {showAdd && (
        <ExpenseFormModal
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            logActivity("expense:create", "expense", {
              targetLabel: "New expense",
              details: "Expense record added",
              userRole,
            });
            setShowAdd(false);
            refresh();
          }}
        />
      )}

      {/* ─── Edit Modal ─── */}
      {editRecord && (
        <ExpenseFormModal
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSaved={() => {
            logActivity("expense:update", "expense", {
              targetId: editRecord.id,
              targetLabel: getCategoryLabel(editRecord.category),
              details: "Expense record updated",
              userRole,
            });
            setEditRecord(null);
            refresh();
          }}
        />
      )}

      {/* ─── Detail Modal ─── */}
      {detailRecord && (
        <ExpenseDetailModal
          record={detailRecord}
          allRecords={items}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={() => {
            setEditRecord(detailRecord);
            setDetailRecord(null);
          }}
          onDelete={() => handleDelete(detailRecord, true)}
          onClose={() => setDetailRecord(null)}
        />
      )}

      {/* ─── Category Modal ─── */}
      {categoryModal && (
        <ExpenseCategoryModal
          category={categoryModal}
          records={items.filter(
            (r) => r.category.toLowerCase() === categoryModal.toLowerCase()
          )}
          canEdit={canEdit}
          canDelete={canDelete}
          onClose={() => setCategoryModal(null)}
          onEditRecord={(r) => {
            setCategoryModal(null);
            setEditRecord(r);
          }}
          onDeleteRecord={(r) => handleDelete(r, true)}
        />
      )}

      {/* ─── Activity Log ─── */}
      {showActivityLog && canSeeActivityLog && (
        <ActivityLogModal
          userRole={userRole}
          canDelete={canDeleteActivityLog}
          onClose={() => setShowActivityLog(false)}
        />
      )}
    </div>
  );
}

// ─── StatCard ───
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
      red: "text-red-700 bg-red-50 border-red-200",
      slate: "text-slate-700 bg-slate-50 border-slate-200",
      orange: "text-orange-700 bg-orange-50 border-orange-200",
      emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
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
