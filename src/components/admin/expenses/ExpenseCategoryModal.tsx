// src/components/admin/expenses/ExpenseCategoryModal.tsx
"use client";

import { useMemo, useState } from "react";
import {
  ExpenseRecord,
  getCategoryIcon,
  getCategoryLabel,
  getCategoryColor,
  formatPaymentMonth,
} from "@/lib/expense-types";
import ExpenseDetailModal from "./ExpenseDetailModal";
import {
  fmt,
  escapeHtml,
  printHTML,
  copyToClipboard,
  shareText,
} from "@/lib/print-utils";

interface Props {
  category: string;
  records: ExpenseRecord[];
  canEdit: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEditRecord?: (r: ExpenseRecord) => void;
  onDeleteRecord?: (r: ExpenseRecord) => void;
}

export default function ExpenseCategoryModal({
  category,
  records,
  canEdit,
  canDelete,
  onClose,
  onEditRecord,
  onDeleteRecord,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [detail, setDetail] = useState<ExpenseRecord | null>(null);

  const totals = useMemo(
    () =>
      records.reduce(
        (a, r) => {
          a.total += Number(r.amount) || 0;
          return a;
        },
        { total: 0 }
      ),
    [records]
  );

  const label = getCategoryLabel(category);
  const icon = getCategoryIcon(category);

  function buildText(): string {
    const lines = [
      `🧾 *CLICK COMPUTER CENTER*`,
      `${icon} ${label} — All Expenses`,
      "───────────────────────",
      `📊 Total Records: ${records.length}`,
      `💸 Total Amount: ${fmt(totals.total)} ETB`,
      "───────────────────────",
    ];
    records.forEach((r, i) => {
      lines.push(
        `${i + 1}. ${r.date.slice(0, 10)} · ${r.employeeName || "—"} · ${fmt(
          r.amount
        )} ETB`
      );
    });
    lines.push("───────────────────────");
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    return lines.join("\n");
  }

  async function copyAll() {
    const ok = await copyToClipboard(buildText());
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  async function shareAll() {
    await shareText(`${label} — Expenses`, buildText());
  }

  function printAll() {
    const rows = records
      .map(
        (r) => `
        <tr>
          <td>${escapeHtml(r.date.slice(0, 10))}</td>
          <td>${escapeHtml(r.employeeName || "—")}</td>
          <td>${escapeHtml(r.jobRole || "—")}</td>
          <td>${escapeHtml(formatPaymentMonth(r.paymentMonth))}</td>
          <td>${escapeHtml(r.description || "—")}</td>
          <td style="text-align:right">${fmt(r.amount)}</td>
        </tr>`
      )
      .join("");

    printHTML({
      title: `${label} — All Expenses`,
      bodyHtml: `
        <h2>${escapeHtml(icon)} ${escapeHtml(label)} Summary</h2>
        <div class="kpi">
          <div><div class="label">Records</div><div class="value">${
            records.length
          }</div></div>
          <div><div class="label">Total</div><div class="value">${fmt(
            totals.total
          )}</div></div>
        </div>
        <h2>All Records</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Employee</th><th>Job Role</th>
              <th>Payment Month</th><th>Description</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="5">TOTAL (${records.length} records)</td>
              <td style="text-align:right">${fmt(totals.total)}</td>
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
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {icon} {label} — All Expenses
              </h2>
              <p className="text-xs text-slate-500">
                {records.length} records · Click row for detail
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={printAll}
                className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
                title="Print All"
              >
                🖨
              </button>
              <button
                onClick={copyAll}
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
                onClick={shareAll}
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
              <Kpi
                label="Records"
                value={String(records.length)}
                color="slate"
              />
              <Kpi label="Total" value={fmt(totals.total)} color="red" />
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-2 font-semibold">Date</th>
                    <th className="text-left px-2 py-2 font-semibold">
                      Employee
                    </th>
                    <th className="text-left px-2 py-2 font-semibold hidden md:table-cell">
                      Job Role
                    </th>
                    <th className="text-left px-2 py-2 font-semibold hidden md:table-cell">
                      Payment Month
                    </th>
                    <th className="text-right px-2 py-2 font-semibold">
                      Amount
                    </th>
                    <th className="text-right px-2 py-2 font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-100 hover:bg-red-50 cursor-pointer"
                      onClick={() => setDetail(r)}
                    >
                      <td className="px-2 py-1.5">{r.date.slice(0, 10)}</td>
                      <td className="px-2 py-1.5">
                        {r.employeeName || "—"}
                      </td>
                      <td className="px-2 py-1.5 hidden md:table-cell">
                        {r.jobRole || "—"}
                      </td>
                      <td className="px-2 py-1.5 hidden md:table-cell">
                        {formatPaymentMonth(r.paymentMonth)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-semibold text-red-600">
                        {fmt(r.amount)}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetail(r);
                          }}
                          className="text-xs px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded"
                        >
                          👁
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-red-50 sticky bottom-0">
                  <tr className="font-bold">
                    <td colSpan={4} className="px-2 py-2">
                      TOTAL ({records.length})
                    </td>
                    <td className="px-2 py-2 text-right">
                      {fmt(totals.total)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {detail && (
        <ExpenseDetailModal
          record={detail}
          allRecords={records}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={() => {
            onEditRecord?.(detail);
            setDetail(null);
          }}
          onDelete={() => {
            onDeleteRecord?.(detail);
            setDetail(null);
          }}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}

function Kpi({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "slate" | "red";
}) {
  const cls = {
    slate: "bg-slate-50 border-slate-200 text-slate-900",
    red: "bg-red-50 border-red-200 text-red-700",
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
