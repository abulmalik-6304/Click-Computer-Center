// src/components/admin/expenses/ExpenseDetailModal.tsx
"use client";

import { useMemo, useState } from "react";
import {
  ExpenseRecord,
  getCategoryIcon,
  getCategoryLabel,
  getCategoryColor,
  formatPaymentMonth,
} from "@/lib/expense-types";
import {
  fmt,
  escapeHtml,
  printHTML,
  copyToClipboard,
  shareText,
} from "@/lib/print-utils";

interface Props {
  record: ExpenseRecord;
  allRecords: ExpenseRecord[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function ExpenseDetailModal({
  record,
  allRecords,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onClose,
}: Props) {
  const [copied, setCopied] = useState(false);

  // Same category records
  const sameCategory = useMemo(
    () =>
      allRecords.filter(
        (r) => r.category.toLowerCase() === record.category.toLowerCase()
      ),
    [allRecords, record.category]
  );

  const catTotal = sameCategory.reduce(
    (s, r) => s + (Number(r.amount) || 0),
    0
  );

  function buildText(): string {
    const lines = [
      "🧾 *CLICK COMPUTER CENTER*",
      `📉 Expense Detail · ${getCategoryLabel(record.category)}`,
      "───────────────────────",
      `📅 Date: ${record.date.slice(0, 10)}`,
      `💼 Category: ${getCategoryLabel(record.category)}`,
      `🗓 Payment Month: ${formatPaymentMonth(record.paymentMonth)}`,
      "───────────────────────",
      `👤 Employee: ${record.employeeName || "—"}`,
      `🏅 Job Role: ${record.jobRole || "—"}`,
      "───────────────────────",
      `💵 *Amount: ${fmt(record.amount)} ETB*`,
      "",
      `📝 ${record.description || "No description"}`,
      "───────────────────────",
      `📊 *${getCategoryLabel(record.category)} — Summary*`,
      `• Records: ${sameCategory.length}`,
      `• Total: ${fmt(catTotal)} ETB`,
      "───────────────────────",
      `Recorded By: ${record.recordedBy || "—"}`,
      `Generated: ${new Date().toLocaleString()}`,
    ];
    return lines.join("\n");
  }

  async function copyDetail() {
    const ok = await copyToClipboard(buildText());
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  async function shareDetail() {
    await shareText(
      `${getCategoryLabel(record.category)} — Expense`,
      buildText()
    );
  }

  function printDetail() {
    printHTML({
      title: `${getCategoryLabel(record.category)} — Expense Detail`,
      bodyHtml: `
        <h2>Expense Info</h2>
        <div class="info">
          <div><strong>ID:</strong> ${escapeHtml(record.id.slice(0, 8))}</div>
          <div><strong>Date:</strong> ${escapeHtml(
            record.date.slice(0, 10)
          )}</div>
          <div><strong>Category:</strong> ${escapeHtml(
            getCategoryLabel(record.category)
          )}</div>
          <div><strong>Payment Month:</strong> ${escapeHtml(
            formatPaymentMonth(record.paymentMonth)
          )}</div>
          <div><strong>Employee:</strong> ${escapeHtml(
            record.employeeName || "—"
          )}</div>
          <div><strong>Job Role:</strong> ${escapeHtml(
            record.jobRole || "—"
          )}</div>
          <div><strong>Recorded By:</strong> ${escapeHtml(
            record.recordedBy || "—"
          )}</div>
        </div>

        <h2>Financial</h2>
        <div class="kpi">
          <div><div class="label">Amount</div><div class="value">${fmt(
            record.amount
          )}</div></div>
        </div>

        <h2>Description</h2>
        <p>${escapeHtml(record.description || "—")}</p>

        <h2>${escapeHtml(
          getCategoryLabel(record.category)
        )} — Summary (${sameCategory.length} records)</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Employee</th><th>Job Role</th>
              <th>Payment Month</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${sameCategory
              .map(
                (r) => `
              <tr>
                <td>${escapeHtml(r.date.slice(0, 10))}</td>
                <td>${escapeHtml(r.employeeName || "—")}</td>
                <td>${escapeHtml(r.jobRole || "—")}</td>
                <td>${escapeHtml(formatPaymentMonth(r.paymentMonth))}</td>
                <td style="text-align:right">${fmt(r.amount)}</td>
              </tr>`
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4">TOTAL</td>
              <td style="text-align:right">${fmt(catTotal)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="signature">
          <div>Prepared By</div>
          <div>Approved By</div>
        </div>
      `,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                  record.category
                )}`}
              >
                {getCategoryIcon(record.category)}{" "}
                {getCategoryLabel(record.category)}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              {record.date.slice(0, 10)} · {record.employeeName || "—"}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={printDetail}
              className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
              title="Print"
            >
              🖨
            </button>
            <button
              onClick={copyDetail}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
              title="Copy"
            >
              {copied ? "✅" : "📋"}
            </button>
            <button
              onClick={shareDetail}
              className="px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg"
              title="Share"
            >
              🔗
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Kpi label="Amount" value={fmt(record.amount)} color="red" />
            <Kpi
              label="Payment Month"
              value={formatPaymentMonth(record.paymentMonth)}
              color="slate"
            />
            <Kpi
              label="Same Category"
              value={`${sameCategory.length} records`}
              color="slate"
            />
          </div>

          {/* Employee */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">👥 Employee</p>
            <p className="text-sm font-bold text-slate-900">
              {record.employeeName || "—"}
            </p>
            {record.jobRole && (
              <p className="text-xs text-slate-600 mt-0.5">
                🏅 {record.jobRole}
              </p>
            )}
          </div>

          {/* Description */}
          {record.description && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-900">{record.description}</p>
            </div>
          )}

          {/* Same category */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              📊 {getCategoryLabel(record.category)} — All Records (
              {sameCategory.length})
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-2 font-semibold">Date</th>
                    <th className="text-left px-2 py-2 font-semibold">
                      Employee
                    </th>
                    <th className="text-left px-2 py-2 font-semibold hidden md:table-cell">
                      Payment Month
                    </th>
                    <th className="text-right px-2 py-2 font-semibold">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sameCategory.map((r) => (
                    <tr
                      key={r.id}
                      className={`border-t border-slate-100 ${
                        r.id === record.id
                          ? "bg-red-50 font-semibold"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-2 py-1.5">{r.date.slice(0, 10)}</td>
                      <td className="px-2 py-1.5">{r.employeeName || "—"}</td>
                      <td className="px-2 py-1.5 hidden md:table-cell">
                        {formatPaymentMonth(r.paymentMonth)}
                      </td>
                      <td className="px-2 py-1.5 text-right text-red-600">
                        {fmt(r.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-red-50 sticky bottom-0">
                  <tr className="font-bold">
                    <td colSpan={3} className="px-2 py-2">
                      TOTAL ({sameCategory.length})
                    </td>
                    <td className="px-2 py-2 text-right">{fmt(catTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Meta */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500">Recorded By:</span>{" "}
            <span className="font-semibold text-slate-900">
              {record.recordedBy || "—"}
            </span>
          </div>

          {/* Actions */}
          {(canEdit || canDelete) && (
            <div className="flex gap-2 pt-2 border-t border-slate-200">
              {canEdit && (
                <button
                  onClick={onEdit}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  ✏️ Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={onDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  🗑 Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "slate" | "red" | "emerald";
}) {
  const cls = {
    slate: "bg-slate-50 border-slate-200 text-slate-900",
    red: "bg-red-50 border-red-200 text-red-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  }[color];
  return (
    <div className={`p-2.5 rounded-lg border ${cls} text-center`}>
      <p className="text-[10px] uppercase tracking-wide opacity-70 font-semibold">
        {label}
      </p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
    </div>
  );
}
